import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReturns = async () => {
    try {
      const response = await fetch(`$ {API}/returns/`);
      const data = await response.lson();
      setReturns(data);
    } catch (error) {
      console.error(error);
    }
  };

}