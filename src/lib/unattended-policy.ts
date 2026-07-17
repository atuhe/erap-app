import type { ErapRole } from "./erap-roles";
import { hasPermission } from "./erap-roles";

export interface UnattendedPolicyDecision {
  allowed: boolean;
  reason: string;
  rolloutNotes: string;
  policyName: string;
  requiresJustification: boolean;
}

interface EvaluateInput {
  role: ErapRole;
  branch: string;
  department: string;
  deviceStatus: "online" | "offline";
}

// Branches / departments still ramping up the unattended access rollout.
const RESTRICTED_DEPARTMENTS = new Set(["Finance", "HR", "Legal"]);
const PILOT_BRANCHES = new Set(["New York", "London", "San Francisco"]);

export function evaluateUnattendedPolicy(input: EvaluateInput): UnattendedPolicyDecision {
  const { role, branch, department, deviceStatus } = input;
  const rolloutNotes =
    "Unattended access is being rolled out branch-by-branch. Pilot branches: New York, London, San Francisco. " +
    "Sensitive departments (Finance, HR, Legal) always require user approval regardless of role.";

  if (deviceStatus === "offline") {
    return {
      allowed: false,
      reason: "Device is offline — cannot open an unattended tunnel.",
      rolloutNotes,
      policyName: "UN-OFFLINE",
      requiresJustification: false,
    };
  }

  if (!hasPermission(role, "remote_desktop")) {
    return {
      allowed: false,
      reason: "Your role does not include Remote Desktop.",
      rolloutNotes,
      policyName: "UN-ROLE",
      requiresJustification: false,
    };
  }

  if (RESTRICTED_DEPARTMENTS.has(department)) {
    return {
      allowed: false,
      reason: `${department} is a protected department. User approval is mandatory.`,
      rolloutNotes,
      policyName: "UN-SENSITIVE-DEPT",
      requiresJustification: false,
    };
  }

  if (!PILOT_BRANCHES.has(branch)) {
    return {
      allowed: false,
      reason: `${branch} has not been enrolled in the unattended access pilot yet.`,
      rolloutNotes,
      policyName: "UN-PILOT-SCOPE",
      requiresJustification: false,
    };
  }

  const privileged =
    role === "system_admin" ||
    role === "regional_admin" ||
    hasPermission(role, "manage_policies");

  if (!privileged) {
    return {
      allowed: false,
      reason: "Unattended access requires an administrator or the Manage Policies permission.",
      rolloutNotes,
      policyName: "UN-ADMIN-ONLY",
      requiresJustification: false,
    };
  }

  return {
    allowed: true,
    reason: "Allowed by your role and endpoint policy.",
    rolloutNotes,
    policyName: "UN-PILOT-ADMIN",
    requiresJustification: true,
  };
}