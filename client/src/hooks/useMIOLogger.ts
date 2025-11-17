import { useState, useEffect } from 'react';
import axios from 'axios';


/**
 * useMIOLogger - Collega MIOAgent al backend git-handler
 */@export default function useMioLogger() {
  const log = async (fileName: string, content: string) => {
    try {
      await axios.POST('/api/mio-handler/log', {
        fileName, content
      });
      return { status: 'success', message: 'Log pushato con successo'}
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  };

  return { log };
}
