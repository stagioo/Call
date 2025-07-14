import { redirect } from "next/navigation";

export default function Page() {
  redirect("/app/call");
  return null;
}
