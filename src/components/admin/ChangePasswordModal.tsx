/**
 * Modal para que cada miembro del equipo cambie su propia contraseña (valida la actual).
 */
import { useState } from 'react';
import { authFetch, readApiError } from '../../lib/serverApi';
import { FormScreen, Field, FormSection } from './crm/CrmUi';
import { useToast } from '../../context/FeedbackContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [nextPw, setNextPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setCurrent('');
    setNextPw('');
    setConfirmPw('');
    setError('');
    onClose();
  };

  const save = async () => {
    setError('');
    if (!current.trim()) {
      setError('Ingresá tu contraseña actual.');
      return;
    }
    if (nextPw.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nextPw !== confirmPw) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    setSaving(true);
    const res = await authFetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: current, new_password: nextPw }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    toast.success('Contraseña actualizada.');
    close();
  };

  if (!open) return null;

  return (
    <FormScreen
      title="Cambiar mi contraseña"
      subtitle="Necesitamos tu contraseña actual para confirmar que sos vos."
      onClose={close}
      onSave={() => void save()}
      saving={saving}
      error={error}
    >
      <FormSection title="Contraseñas">
        <Field
          label="Contraseña actual"
          type="password"
          value={current}
          onChange={setCurrent}
          placeholder="••••••••"
        />
        <Field
          label="Nueva contraseña"
          type="password"
          value={nextPw}
          onChange={setNextPw}
          placeholder="Mínimo 8 caracteres"
        />
        <Field
          label="Repetir nueva contraseña"
          type="password"
          value={confirmPw}
          onChange={setConfirmPw}
          placeholder="Igual que arriba"
        />
      </FormSection>
    </FormScreen>
  );
}
