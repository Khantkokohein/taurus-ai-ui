"use client";

import { useState } from "react";

export default function Page() {
  const [data, setData] = useState<any>(null);

  const handle = async () => {
    const res = await fetch("/api/generate-number", {
      method: "POST",
    });
    const json = await res.json();
    setData(json);
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={handle}>Generate</button>

      {data && (
        <div style={{ marginTop: 20 }}>
          <p>{data.number}</p>
          <p>{data.pattern}</p>
        </div>
      )}
    </div>
  );
}