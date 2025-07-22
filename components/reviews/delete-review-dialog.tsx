"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  placeName: string
  isDeleting: boolean
}

export function DeleteReviewDialog({ isOpen, onClose, onConfirm, placeName, isDeleting }: DeleteReviewDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar tu reseña de <strong>{placeName}</strong>. Esta acción no se puede deshacer y
            perderás todos los puntos ganados por esta reseña.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
