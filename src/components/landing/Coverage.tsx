import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_FRAMEWORKS, frameworkPath } from "@/lib/content";

interface Framework { code: string; label: string }

/** Regulations and standards covered today, read live from the Learn hub's vocabulary so the list grows as content is published. */
export function Coverage() {
  const [frameworks, setFrameworks] = useState<Framework[]>(() => DEFAULT_FRAMEWORKS.map((code) => ({ code, label: code })));
  useEffect(() => {
    let alive = true;
    supabase.from("content_frameworks").select("code,label").eq("is_active", true).order("display_order")
      .then(({ data }) => { if (alive && data && data.length) setFrameworks(data as Framework[]); });
    return () => { alive = false; };
  }, []);
  return (
    <section className="lp-cover">
      <div className="lp-wrap">
        <div>
          <h2>Regulations and standards we cover today.</h2>
          <p>The list grows as we publish.</p>
        </div>
        <ul>
          {frameworks.map((f) => <li key={f.code}><Link to={frameworkPath(f.code)}>{f.label}</Link></li>)}
        </ul>
      </div>
    </section>
  );
}
