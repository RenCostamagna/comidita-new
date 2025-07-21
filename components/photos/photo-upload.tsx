"use client"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"

interface PhotoUploadProps {
  reviewId: string
  onUploadComplete: () => void
}

export function PhotoUpload({ reviewId, onUploadComplete }) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const handleUpload = async () => {
    setUploading(true)
    setUploadError(null)

    const formData = new FormData()

    // Append files to FormData
    try {
      // --- CLIENT-SIDE DEBUGGING ---
      console.log("--- Iniciando subida de fotos (Client-Side) ---")
      console.log(`Review ID: ${reviewId}`)
      console.log(`Total de archivos a subir: ${files.length}`)

      files.forEach((file, index) => {
        // --- CLIENT-SIDE DEBUGGING ---
        console.log(`[CLIENT DEBUG] Processing file ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        })
        // ---
        console.log(`Archivo ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        })
        // Asegúrate de que el tercer parámetro (nombre del archivo) se esté pasando
        formData.append("photos", file, file.name)
      })
      console.log("--- FormData construido. Enviando al servidor... ---")
      // --- FIN CLIENT-SIDE DEBUGGING ---

      const response = await fetch(`/api/reviews/${reviewId}/photos`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        setUploadError(errorData.message || "Error al subir las fotos.")
      } else {
        setFiles([])
        onUploadComplete()
      }
    } catch (error: any) {
      setUploadError(error.message || "Error de conexión al subir las fotos.")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div>
      <div
        {...getRootProps()}
        style={{ border: "1px dashed gray", padding: "20px", textAlign: "center", cursor: "pointer" }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Suelta los archivos aquí...</p>
        ) : (
          <p>Arrastra y suelta archivos aquí, o haz clic para seleccionar archivos</p>
        )}
      </div>

      {files.length > 0 && (
        <div>
          <h4>Archivos seleccionados:</h4>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name} - {file.size} bytes
                <button type="button" onClick={() => handleRemoveFile(index)}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir fotos"}
          </button>
        </div>
      )}

      {uploadError && <p style={{ color: "red" }}>Error: {uploadError}</p>}
    </div>
  )
}

export default PhotoUpload
