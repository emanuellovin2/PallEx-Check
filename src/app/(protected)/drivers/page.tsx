import { redirect } from "next/navigation";

/**
 * Drivers management has moved to /admin/drivers.
 * Non-admins are blocked by the admin layout guard.
 */
export default function DriversPage() {
  redirect("/admin/drivers");
}
