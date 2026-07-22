"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/modal";
import { createId } from "@/lib/utils";
import type { VialCost } from "@/types/domain";

import { useCreateVial, useUpdateVial } from "../api/decant.mutation";

export function VialFormModal({
  open,
  vial,
  onClose,
}: {
  open: boolean;
  vial: VialCost | null;
  onClose: () => void;
}) {
  const createVialMutation = useCreateVial();
  const updateVialMutation = useUpdateVial();
  const [sizeMl, setSizeMl] = useState(vial?.sizeMl ?? 0);
  const [cost, setCost] = useState(vial?.cost ?? 0);
  const [active, setActive] = useState(vial?.active ?? true);
  const saving = createVialMutation.isPending || updateVialMutation.isPending;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    if (sizeMl <= 0 || cost < 0) {
      toast.error("Ukuran dan biaya vial harus valid.");
      return;
    }
    try {
      const now = new Date().toISOString();
      if (vial) {
        await updateVialMutation.mutateAsync({ id: vial.id, input: { sizeMl, cost, active } });
        toast.success("Biaya vial diperbarui.");
      } else {
        await createVialMutation.mutateAsync({
          id: createId("vial"),
          sizeMl,
          cost,
          active,
          createdAt: now,
          updatedAt: now,
        });
        toast.success("Ukuran vial ditambahkan.");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Biaya vial ${sizeMl} ml gagal disimpan.`);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => { if (!nextOpen && !saving) onClose(); }}
      title={vial ? "Edit biaya vial" : "Tambah ukuran vial"}
      description="Biaya ini otomatis masuk ke modal setiap resep decant yang menggunakannya."
    >
      <form onSubmit={submit}>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <Field label="Ukuran vial (ml)">
            <Input
              type="number"
              min="1"
              value={sizeMl}
              onChange={(event) => setSizeMl(Math.max(0, Number(event.target.value) || 0))}
            />
          </Field>
          <Field label="Vial + label (Rp)">
            <Input
              type="number"
              min="0"
              value={cost}
              onChange={(event) => setCost(Math.max(0, Number(event.target.value) || 0))}
            />
          </Field>
          <div className="sm:col-span-2">
            <Switch
              checked={active}
              onChange={setActive}
              label="Ukuran aktif"
              description="Ukuran nonaktif tidak ditawarkan pada resep baru, tetapi data lama tetap aman."
            />
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-4 sm:px-7">
          <Button variant="ghost" disabled={saving} onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={saving}><Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan vial"}</Button>
        </footer>
      </form>
    </Modal>
  );
}
