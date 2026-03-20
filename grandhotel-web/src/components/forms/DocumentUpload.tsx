/**
 * DocumentUpload Bileşeni
 *
 * Tekli belge yükleme bileşeni (reusable).
 * PDF ve görsel dosyaları destekler.
 * İşletme belgesi, vergi levhası gibi belgeler için kullanılır.
 */

import React, { useRef } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import {
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { HotelDocument } from '../../utils/constants';
import { fileToBase64, isValidDocumentType, isValidFileSize } from '../../utils/imageUtils';

interface DocumentUploadProps {
  document?: HotelDocument;
  onChange: (doc: HotelDocument | undefined) => void;
  label: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ document, onChange, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidDocumentType(file)) return;
    if (!isValidFileSize(file, 1)) return;

    try {
      const base64 = await fileToBase64(file);
      const maxId = document?.id ?? 0;
      onChange({
        id: maxId + 1,
        name: file.name,
        type: file.type,
        data: base64,
        uploadedAt: new Date().toISOString(),
      });
    } catch {
      /* atlat */
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = () => {
    onChange(undefined);
  };

  const isPdf = document?.type === 'application/pdf';

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>

      {document ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            bgcolor: 'grey.50',
          }}
        >
          {isPdf ? (
            <PdfIcon sx={{ color: 'error.main', fontSize: 32 }} />
          ) : (
            <Box
              component="img"
              src={document.data}
              alt={document.name}
              sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
            />
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
              {document.name}
            </Typography>
            <Chip
              label={isPdf ? 'PDF' : 'Görsel'}
              size="small"
              icon={isPdf ? <PdfIcon /> : <ImageIcon />}
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          </Box>

          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleRemove}
            sx={{ textTransform: 'none' }}
          >
            Sil
          </Button>
        </Box>
      ) : (
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => inputRef.current?.click()}
          sx={{
            textTransform: 'none',
            borderStyle: 'dashed',
            py: 1.5,
            width: '100%',
            color: 'text.secondary',
          }}
        >
          Dosya Yükle (PDF veya Görsel, max 1MB)
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        hidden
        onChange={handleFileSelect}
      />
    </Box>
  );
};

export default DocumentUpload;
