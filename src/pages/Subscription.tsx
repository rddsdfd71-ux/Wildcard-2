import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Subscription() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/settings"); }, []);
  return null;
}
