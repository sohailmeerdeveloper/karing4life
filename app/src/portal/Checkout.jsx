import { Btn, Modal, Notice, PIcon } from './ui.jsx';

/**
 * Order summary before Stripe Checkout. Stripe is connected in Milestone 3; until then this
 * shows the summary and explains that checkout opens at launch (nothing is charged).
 */
export default function Checkout({ open, onClose, items = [], title, recurring, portal }) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  // "Manage payment method" → Stripe's customer portal at launch; no total or Pay button before then
  if (portal) return (
    <Modal open={open} onClose={onClose} title="Payment method" icon="card" footer={<Btn variant="primary" onClick={onClose}>Got it</Btn>}>
      <div className="pf">
        <Notice icon="lock"><strong>Coming at launch.</strong> You’ll update your card, download receipts and cancel plans in Stripe’s secure billing portal. Nothing has been charged.</Notice>
        <div className="flex small muted" style={{ gap: 8 }}><PIcon name="shield" className="pi-sm" />Card details never touch Karing4Life’s servers.</div>
      </div>
    </Modal>
  );
  return (
    <Modal open={open} onClose={onClose} title={title || 'Checkout'} icon="card"
      footer={<><Btn variant="ghost" onClick={onClose}>Close</Btn><Btn variant="success" icon="lock" disabled title="Payments open at launch">Pay at launch · ${total.toFixed(2)}{recurring ? ' / mo' : ''}</Btn></>}>
      <div className="pf">
        <div className="kv">
          {items.map((i) => <div key={i.label}><span className="k">{i.label}</span><span className="v money">${i.amount.toFixed(2)}</span></div>)}
          <div><span className="k" style={{ color: 'var(--ink)', fontWeight: 800 }}>Total{recurring ? ' per month' : ''}</span><span className="v money" style={{ fontSize: 18 }}>${total.toFixed(2)}</span></div>
        </div>
        <Notice icon="lock"><strong>Secure checkout opens at launch.</strong> Payments are handled by Stripe and are being connected now. Nothing has been charged.</Notice>
        <div className="flex small muted" style={{ gap: 8 }}><PIcon name="shield" className="pi-sm" />Card details never touch Karing4Life’s servers. {recurring && 'Cancel anytime from Billing.'}</div>
      </div>
    </Modal>
  );
}
