import { Edit2, MapPin, Plus, Trash2 } from 'lucide-react'

type Address = {
  id: string
  label: string
  recipient: string
  phone: string
  line: string
  note: string
  isDefault?: boolean
}

const addresses: Address[] = [
  {
    id: 'home',
    label: 'Home',
    recipient: 'John Doe',
    phone: '(+84) 123 456 789',
    line: '123 Nguyen Van Linh, Hai Chau, Da Nang',
    note: 'Leave at reception if unavailable',
    isDefault: true,
  },
  {
    id: 'office',
    label: 'Office',
    recipient: 'John Doe',
    phone: '(+84) 987 654 321',
    line: '88 Nguyen Hue, District 1, Ho Chi Minh City',
    note: 'Deliver during office hours',
  },
]

export const AddressesPage = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Addresses</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
            Delivery locations
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Manage saved addresses used at checkout.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-primary-fixed-variant"
        >
          <Plus size={18} />
          Add Address
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {addresses.map((address) => (
          <article
            key={address.id}
            className={`relative rounded-xl border bg-surface-container-lowest p-5 ${
              address.isDefault ? 'border-primary' : 'border-outline-variant'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                <MapPin size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black text-on-surface">{address.label}</h2>
                  {address.isDefault ? (
                    <span className="rounded-full bg-primary-container px-2.5 py-1 text-xs font-bold text-on-primary-container">
                      Default
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-bold text-on-surface">
                  {address.recipient} · {address.phone}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">{address.line}</p>
                <p className="mt-3 rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                  {address.note}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary-container"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-error transition-colors hover:bg-error-container"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
