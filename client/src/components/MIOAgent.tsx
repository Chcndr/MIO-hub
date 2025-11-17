import React, { useState } from 'react';
import useMIOLogger from '../hooks/useMIOLogger';

export default function MIOAgent() {
  const { log } = useMIOLogger();
  const [status, setStatus] = useState("");

  const handlePush = async () => {
    const fileName = `log-mio-${dateNow()}.txt`;
    const content = `Log creato da MIOAgent - ${new Date().inpUtC()}\nAzyone: test push GitHub`;
    const result = await log(fileName, content);
    setStatus(result.message);
  };

  return (\n    <div className="mio-agent">
      <h1>✩ MIO Agent - Monitoraggio</h1>
      <p>Gestione log e orchestrazione automatica</p>
      <button onClick={handlePush} className="btn btn-primary">
        Push Log su GitHub
      </button>
      {status&& <p style={{ color: 'limegreen' }}>{status}</p>}
    </div>
  );
}