import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TopBar } from '../../components/layout/TopBar';
import { db, type FieldLangEntry } from '../../db';
import { config } from '../../config/builder';
import { Section } from '../../components/settings/SettingsField';

const SEED_ENTRIES: Omit<FieldLangEntry, 'id' | 'createdAt'>[] = [
  { term: 'Straps', trade: 'Framing / Siding', aliases: ['rat run', 'metal strap', 'wind brace'] },
  { term: 'Nail Pops', trade: 'Drywall', aliases: ['nail pop', 'popped nail', 'nail coming through'] },
  { term: 'Shoe Molding', trade: 'Trim / Baseboard / Caulk', aliases: ['shoe', 'quarter round'] },
  { term: 'Tub Surround', trade: 'Painting & Touch-Up', aliases: ['tub wall', 'shower surround'] },
  { term: 'Weatherstrip', trade: 'Door Hardware', aliases: ['weather strip', 'door seal'] },
  { term: 'Sill Plate', trade: 'Door Hardware', aliases: ['door threshold', 'sill'] },
  { term: 'Backsplash', trade: 'Stairs / Flooring', aliases: ['back splash', 'kitchen tile back'] },
  { term: 'Flatwork', trade: 'Concrete', aliases: ['slab', 'driveway concrete', 'sidewalk'] },
];

export function FieldLanguageSettings() {
  const entries = useLiveQuery(() => db.fieldLanguage.toArray()) ?? [];
  const [expanded, setExpanded] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded) return;
    (async () => {
      const existing = await db.fieldLanguage.count();
      if (existing === 0) {
        await db.fieldLanguage.bulkPut(
          SEED_ENTRIES.map((e) => ({
            ...e,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          }))
        );
      }
      setSeeded(true);
    })();
  }, [seeded]);

  const tradeOptions = Array.from(
    new Set([...Object.keys(config.tradePartners), ...entries.map((e) => e.trade)])
  ).sort();

  const addEntry = async () => {
    const term = prompt('Standard term (e.g. "Nail Pops")');
    if (!term) return;
    const trade = prompt(`Trade (choose from:\n${tradeOptions.join('\n')})`);
    if (!trade) return;
    const aliasStr = prompt('Aliases, comma-separated (e.g. "nail pop, popped nail")');
    const aliases = aliasStr ? aliasStr.split(',').map((a) => a.trim()).filter(Boolean) : [];
    await db.fieldLanguage.put({
      id: crypto.randomUUID(),
      term: term.trim(),
      trade: trade.trim(),
      aliases,
      createdAt: new Date().toISOString(),
    });
  };

  const removeEntry = async (id: string) => {
    if (!confirm('Remove this term?')) return;
    await db.fieldLanguage.delete(id);
  };

  return (
    <div>
      <TopBar title="Field Language" back />

      <div className="bg-surface rounded-xl p-4 mb-4">
        <div className="text-xs text-g500 leading-relaxed">
          <span className="font-bold text-cblack">Optional.</span> Map field terms to trades so voice capture and
          typing auto-route to the right partner. Pre-loaded with common terms — edit or add your own.
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between bg-surface hover:bg-mar-l border-[1.5px] border-g200 rounded-xl p-3 text-left mb-4 transition-colors"
      >
        <span className="text-sm font-bold text-cblack">
          {expanded ? 'Hide' : 'Show'} field language list ({entries.length})
        </span>
        <svg className={`text-g400 transition-transform ${expanded ? 'rotate-90' : ''}`} width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 4L13 10L7 16" />
        </svg>
      </button>

      {expanded && (
        <Section title="Terms">
          {entries.length === 0 ? (
            <div className="text-sm text-g400 text-center py-4">Loading…</div>
          ) : (
            entries
              .slice()
              .sort((a, b) => a.term.localeCompare(b.term))
              .map((e) => (
                <div key={e.id} className="bg-[var(--card-2)] rounded-lg p-3 border-[1.5px] border-g200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-cblack">{e.term}</div>
                      <div className="text-xs text-g500 mt-0.5">→ {e.trade}</div>
                      {e.aliases.length > 0 && (
                        <div className="text-xs text-g400 mt-1">
                          also: {e.aliases.join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeEntry(e.id)}
                      className="text-xs text-red-600 font-semibold hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
          )}

          <button
            onClick={addEntry}
            className="w-full bg-mar text-white font-bold py-3 rounded-lg hover:bg-mar-light transition-colors"
          >
            + Add term
          </button>
        </Section>
      )}
    </div>
  );
}
