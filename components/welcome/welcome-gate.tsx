"use client";

import { useEffect, useState } from "react";
import { WelcomeExperience } from "./welcome-experience";

const SESSION_KEY = "jmf-welcomed";

/**
 * Decide si mostrar la bienvenida: solo tras el login (?welcome=1) y UNA vez
 * por sesión del navegador. Limpia el parámetro para que un refresh no la repita.
 * Si algo falla, no muestra nada (nunca bloquea el acceso al sistema).
 */
export function WelcomeGate({ nombre, farmacia }: { nombre: string; farmacia: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pedido = params.get("welcome") === "1";

      if (pedido) {
        // Quita el parámetro sin recargar (un refresh ya no repetirá la bienvenida).
        params.delete("welcome");
        const qs = params.toString();
        window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
      }

      if (pedido && !sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setShow(true);
      }
    } catch {
      setShow(false);
    }
  }, []);

  if (!show) return null;
  return <WelcomeExperience nombre={nombre} farmacia={farmacia} onDone={() => setShow(false)} />;
}
