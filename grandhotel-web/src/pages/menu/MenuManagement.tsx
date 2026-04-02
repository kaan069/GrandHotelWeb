/**
 * Menü Yönetimi Sayfası
 *
 * Sol: Kategori listesi | Sağ: Seçili kategorinin ürünleri
 * Aşçı, restoran müdürü, müdür, patron erişebilir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RestaurantMenu as MenuIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { menuApi } from '../../api/services';
import type { ApiMenuCategory, ApiMenuItem } from '../../api/services';
import { formatCurrency } from '../../utils/formatters';

const MenuManagement: React.FC = () => {
  const [categories, setCategories] = useState<ApiMenuCategory[]>([]);
  const [items, setItems] = useState<ApiMenuItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  /* Dialog state */
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catEditId, setCatEditId] = useState<number | null>(null);
  const [catName, setCatName] = useState('');

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemEditId, setItemEditId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', categoryId: 0 });

  /* Kategori yükle */
  const fetchCategories = useCallback(async () => {
    try {
      const data = await menuApi.getCategories();
      setCategories(data);
      if (!selectedCatId && data.length > 0) {
        setSelectedCatId(data[0].id);
      }
    } catch (err) {
      console.error('Kategoriler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /* Ürün yükle */
  const fetchItems = useCallback(async () => {
    if (!selectedCatId) return;
    setItemsLoading(true);
    try {
      const data = await menuApi.getItems({ categoryId: selectedCatId });
      setItems(data);
    } catch (err) {
      console.error('Ürünler yüklenemedi:', err);
    } finally {
      setItemsLoading(false);
    }
  }, [selectedCatId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  /* Kategori kaydet */
  const handleCategorySave = async () => {
    if (!catName.trim()) return;
    try {
      if (catEditId) {
        await menuApi.updateCategory(catEditId, { name: catName.trim() });
      } else {
        await menuApi.createCategory({ name: catName.trim() });
      }
      setCatDialogOpen(false);
      setCatName('');
      setCatEditId(null);
      fetchCategories();
    } catch (err) {
      console.error('Kategori kayıt hatası:', err);
    }
  };

  /* Kategori sil */
  const handleCategoryDelete = async (id: number) => {
    if (!window.confirm('Bu kategori ve altındaki tüm ürünler silinecek. Emin misiniz?')) return;
    try {
      await menuApi.deleteCategory(id);
      if (selectedCatId === id) setSelectedCatId(null);
      fetchCategories();
    } catch (err) {
      console.error('Kategori silme hatası:', err);
    }
  };

  /* Ürün kaydet */
  const handleItemSave = async () => {
    if (!itemForm.name.trim() || !itemForm.price) return;
    try {
      const formData = new FormData();
      formData.append('name', itemForm.name.trim());
      formData.append('description', itemForm.description.trim());
      formData.append('price', itemForm.price);
      formData.append('categoryId', String(itemForm.categoryId || selectedCatId));

      if (itemEditId) {
        await menuApi.updateItem(itemEditId, {
          name: itemForm.name.trim(),
          description: itemForm.description.trim(),
          price: itemForm.price,
          categoryId: itemForm.categoryId || selectedCatId,
        });
      } else {
        await menuApi.createItem(formData);
      }
      setItemDialogOpen(false);
      setItemEditId(null);
      setItemForm({ name: '', description: '', price: '', categoryId: 0 });
      fetchItems();
    } catch (err) {
      console.error('Ürün kayıt hatası:', err);
    }
  };

  /* Ürün sil */
  const handleItemDelete = async (id: number) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await menuApi.deleteItem(id);
      fetchItems();
    } catch (err) {
      console.error('Ürün silme hatası:', err);
    }
  };

  /* Ürün düzenle */
  const openItemEdit = (item: ApiMenuItem) => {
    setItemEditId(item.id);
    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryId,
    });
    setItemDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <PageHeader
        title="Menü Yönetimi"
        subtitle={`${categories.length} kategori, ${items.length} ürün`}
      />

      <Grid container spacing={2}>
        {/* Sol: Kategoriler */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>Kategoriler</Typography>
                <IconButton size="small" color="primary" onClick={() => { setCatEditId(null); setCatName(''); setCatDialogOpen(true); }}>
                  <AddIcon />
                </IconButton>
              </Box>
              <List dense disablePadding>
                {categories.map((cat) => (
                  <ListItemButton
                    key={cat.id}
                    selected={selectedCatId === cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText
                      primary={cat.name}
                      secondary={`${cat.itemCount || 0} ürün`}
                    />
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setCatEditId(cat.id); setCatName(cat.name); setCatDialogOpen(true); }}>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleCategoryDelete(cat.id); }}>
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </ListItemButton>
                ))}
                {categories.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Henüz kategori yok
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ: Ürünler */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  <MenuIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} />
                  {categories.find((c) => c.id === selectedCatId)?.name || 'Ürünler'}
                </Typography>
                {selectedCatId && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setItemEditId(null); setItemForm({ name: '', description: '', price: '', categoryId: selectedCatId }); setItemDialogOpen(true); }}
                  >
                    Ürün Ekle
                  </Button>
                )}
              </Box>

              {itemsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : !selectedCatId ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  Sol panelden bir kategori seçin
                </Typography>
              ) : items.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  Bu kategoride henüz ürün yok
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {items.map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        {item.imageUrl && (
                          <Box
                            component="img"
                            src={item.imageUrl}
                            sx={{ width: '100%', height: 140, objectFit: 'cover' }}
                          />
                        )}
                        <CardContent sx={{ pb: '8px !important' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="subtitle2" fontWeight={600}>{item.name}</Typography>
                            <Chip
                              icon={item.isAvailable ? <AvailableIcon /> : <UnavailableIcon />}
                              label={item.isAvailable ? 'Mevcut' : 'Tükendi'}
                              size="small"
                              color={item.isAvailable ? 'success' : 'default'}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem' }}
                            />
                          </Box>
                          {item.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {item.description}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="h6" fontWeight={700} color="primary">
                              {formatCurrency(parseFloat(item.price))}
                            </Typography>
                            <Box>
                              <IconButton size="small" onClick={() => openItemEdit(item)}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleItemDelete(item.id)}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Kategori Dialog */}
      <Dialog open={catDialogOpen} onClose={() => setCatDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{catEditId ? 'Kategori Düzenle' : 'Yeni Kategori'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Kategori Adı"
            fullWidth
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatDialogOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleCategorySave} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Ürün Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{itemEditId ? 'Ürün Düzenle' : 'Yeni Ürün'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Ürün Adı"
            fullWidth
            value={itemForm.name}
            onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
          />
          <TextField
            label="Açıklama / İçerik"
            fullWidth
            multiline
            rows={2}
            value={itemForm.description}
            onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
          />
          <TextField
            label="Fiyat (₺)"
            type="number"
            fullWidth
            value={itemForm.price}
            onChange={(e) => setItemForm((p) => ({ ...p, price: e.target.value }))}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)} color="inherit">İptal</Button>
          <Button onClick={handleItemSave} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MenuManagement;
