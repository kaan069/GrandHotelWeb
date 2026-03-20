/**
 * ImageUpload Bileşeni
 *
 * Çoklu görsel yükleme bileşeni (reusable).
 * Görselleri base64 olarak sıkıştırıp döndürür.
 * Otel görselleri ve oda tipi görselleri için kullanılır.
 */

import React, { useRef } from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import {
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoIcon,
} from '@mui/icons-material';

import { fileToBase64, compressImage, isValidImageType, isValidFileSize } from '../../utils/imageUtils';

interface ImageItem {
  id: number;
  name: string;
  data: string;
}

interface ImageUploadProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 10,
  label = 'Görseller',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remaining);
    const maxId = images.reduce((max, img) => Math.max(max, img.id), 0);
    const newImages: ImageItem[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];

      if (!isValidImageType(file)) continue;
      if (!isValidFileSize(file, 5)) continue;

      try {
        const base64 = await fileToBase64(file);
        const compressed = await compressImage(base64);
        newImages.push({
          id: maxId + i + 1,
          name: file.name,
          data: compressed,
        });
      } catch {
        /* atlat */
      }
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }

    // Input'u sıfırla (aynı dosyayı tekrar seçebilmek için)
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (id: number) => {
    onChange(images.filter((img) => img.id !== id));
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
        {label} ({images.length}/{maxImages})
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {images.map((img) => (
          <Box
            key={img.id}
            sx={{
              position: 'relative',
              width: 120,
              height: 90,
              borderRadius: 1.5,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              component="img"
              src={img.data}
              alt={img.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              onClick={() => handleRemove(img.id)}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                p: 0.25,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}

        {images.length < maxImages && (
          <Button
            variant="outlined"
            onClick={() => inputRef.current?.click()}
            sx={{
              width: 120,
              height: 90,
              borderRadius: 1.5,
              borderStyle: 'dashed',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              textTransform: 'none',
              color: 'text.secondary',
            }}
          >
            <AddPhotoIcon />
            <Typography variant="caption">Ekle</Typography>
          </Button>
        )}
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={handleFileSelect}
      />
    </Box>
  );
};

export default ImageUpload;
