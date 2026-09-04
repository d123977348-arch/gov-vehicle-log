'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RecordsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [rows, setRows] = useState<any[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const plate = searchParams.get('plate') || '';

  useEffect(() => {
    void load();
    // Initial load only; later searches are triggered by the 查詢 button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const query = new URLSearchParams();
    if (plate) query.set('plate', plate);
    if (from) query.set('from', from);
    if (to) query.set('to', to);

    const response = await fetch('/api/records?' + query.toString());
    const data = await response.json();
    setRows(data.rows || []);
  }

  async function exportExcel() {
    const response = await fetch(
      '/api/export?' + new URLSearchParams({ plate, from, to }).toString()
    );

    if (!response.ok) return;

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `公務車使用紀錄${plate ? '_' + plate : ''}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main className="container">
      <div className="toolbar">
        <div>
          <button className="btn" onClick={() => router.push('/dashboard')}>
            ← 返回
          </button>
          <h1>紀錄與彙整</h1>
        </div>
        <div>
          <button className="btn primary" onClick={exportExcel}>
            匯出 Excel
          </button>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <div className="field">
            <label>開始日期</label>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>

          <div className="field">
            <label>結束日期</label>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        </div>

        <button className="btn" onClick={load}>
          查詢
        </button>
      </div>

      <div className="tablewrap" style={{ marginTop: 16 }}>
        <table className="table">
          <thead>
            <tr>
              <th>日期</th>
              <th>車牌</th>
              <th>使用人</th>
              <th>起訖地點</th>
              <th>時間</th>
              <th>里程</th>
              <th>用途</th>
              <th>加油里程</th>
              <th>加油費</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{row.usage_date}</td>
                <td>{row.plate}</td>
                <td>{row.users}</td>
                <td>{row.route}</td>
                <td>
                  {row.start_time}～{row.end_time}
                </td>
                <td>
                  {row.start_mileage}～{row.end_mileage}
                </td>
                <td>{row.purposes}</td>
                <td>{row.fuel_mileages || ''}</td>
                <td>{row.fuel_amount || ''}</td>
                <td>{row.remark || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default function RecordsPage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <div className="card">載入紀錄中…</div>
        </main>
      }
    >
      <RecordsContent />
    </Suspense>
  );
}
