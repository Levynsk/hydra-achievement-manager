import React, { useCallback, useEffect, useState } from 'react';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Achievement, PendingSteamUnlock } from '../types';
import {
  cancelPendingSteamUnlock,
  getPendingSteamUnlocks,
  onPendingSteamUnlocksUpdate,
} from '../tauri-api';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { formatDateObj } from '../formatters';
import { Button } from '@/components/ui/button';

interface PendingSteamUnlocksProps {
  appId: number;
  achievements?: Achievement[];
}

/**
 * Lista os unlocks Steam agendados para o futuro.
 *
 * A Steam não permite alterar o horário de uma conquista, então o app espera
 * até o timestamp escolhido e só então desbloqueia. Esta lista permite ver e
 * cancelar o que está na fila.
 */
const PendingSteamUnlocks: React.FC<PendingSteamUnlocksProps> = ({
  appId,
  achievements,
}) => {
  const { t } = useI18n();
  const { dateFormat, timeFormat } = useTheme();
  const [pending, setPending] = useState<PendingSteamUnlock[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const items = await getPendingSteamUnlocks();
      setPending(items.filter((item) => item.appId === appId));
    } catch (error) {
      console.error('Failed to load pending Steam unlocks:', error);
      setPending([]);
    }
  }, [appId]);

  useEffect(() => {
    let disposed = false;
    let unlisten: UnlistenFn | undefined;

    load();

    onPendingSteamUnlocksUpdate(() => {
      load();
      // A fila mudou: pode ter sido um unlock aplicado no horário, então
      // recarrega a lista de conquistas desta fonte.
      window.dispatchEvent(
        new CustomEvent('achievements-source-updated', {
          detail: { gameId: appId, sourcePath: 'steam://' },
        }),
      );
    })
      .then((stop) => {
        if (disposed) {
          stop();
        } else {
          unlisten = stop;
        }
      })
      .catch((error) => {
        console.error('Failed to listen for pending Steam unlock updates:', error);
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [load]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelPendingSteamUnlock(id);
      await load();
    } catch (error) {
      console.error('Failed to cancel pending Steam unlock:', error);
      toast.error(t('pendingSteamUnlocks.cancelError'));
    } finally {
      setCancellingId(null);
    }
  };

  if (pending.length === 0) {
    return null;
  }

  const resolveName = (achievementName: string) =>
    achievements?.find((achievement) => achievement.internalName === achievementName)?.displayName
    || achievementName;

  return (
    <section className="flex-shrink-0 rounded-md border border-border bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t('pendingSteamUnlocks.title', { count: pending.length })}
        </h2>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground/80">
        {t('pendingSteamUnlocks.description')}
      </p>
      <ul className="mt-2 divide-y divide-border/60">
        {pending.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground" title={resolveName(item.achievementName)}>
                {resolveName(item.achievementName)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t('pendingSteamUnlocks.unlocksAt', {
                  date: formatDateObj(new Date(item.unlockAt * 1000), dateFormat, timeFormat),
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 px-3 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
              disabled={cancellingId === item.id}
              onClick={() => handleCancel(item.id)}
            >
              {t('pendingSteamUnlocks.cancel')}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PendingSteamUnlocks;
