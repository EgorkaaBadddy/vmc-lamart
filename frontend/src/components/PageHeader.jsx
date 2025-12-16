export const PageHeader = ({ status }) => {
  const statusClass =
    status.tone === "danger"
      ? "status danger"
      : status.tone === "success"
      ? "status success"
      : "status";

  return (
    <header className="page-head">
      <div>
        <div className="eyebrow">Сервис расчета импорта</div>
        <h1>Калькулятор менеджера</h1>
      </div>
      <div className={statusClass}>{status.text}</div>
    </header>
  );
};
