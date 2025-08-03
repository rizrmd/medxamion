import { useEffect } from "react";
import { navigate } from "@/lib/router";

export default function LoginRedirect() {
  useEffect(() => {
    navigate("/auth/login");
  }, []);

  return null;
}