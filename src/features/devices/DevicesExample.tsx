import { useEffect, useState } from "react";
import { getDevices } from "./deviceService";
import type { Device } from "./device.types";

// A plain, unstyled reference for how to load real devices. Copy the
// data-loading pattern (useEffect + loading/error/data) into your existing
// styled Devices page, replacing whatever returns the mock array.
export function DevicesExample() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDevices()
      .then(setDevices)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading devices…</p>;
  if (error) return <p style={{ color: "crimson" }}>Couldn't load devices: {error}</p>;
  if (devices.length === 0) return <p>No devices registered yet.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Hostname</th><th>User</th><th>Branch</th><th>IP : Port</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        {devices.map((d) => (
          <tr key={d.deviceId}>
            <td>{d.hostname}</td>
            <td>{d.currentUsername ?? "—"}</td>
            <td>{d.branch ?? "—"}</td>
            <td>{d.ipAddress}:{d.rustDeskPort}</td>
            <td>{d.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
