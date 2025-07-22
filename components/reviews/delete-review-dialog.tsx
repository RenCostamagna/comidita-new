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
            Estás a punto de eliminar tu reseña de <strong>{placeName}</strong>.
            <br />
            <br />
            Esta acción no se puede deshacer. Se eliminarán:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Tu reseña y puntuaciones</li>
              <li>Fotos subidas</li>
              <li>Comentarios asociados</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Eliminando..." : "Eliminar reseña"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
