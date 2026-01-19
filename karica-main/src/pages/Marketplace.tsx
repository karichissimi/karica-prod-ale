import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Search, 
  Star, 
  Package, 
  Thermometer, 
  Sun, 
  Home, 
  Wifi, 
  Car,
  Filter,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price_eur: number;
  original_price_eur: number | null;
  image_url: string | null;
  features: unknown;
  is_featured: boolean;
  category_id: string;
  category?: ProductCategory;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Thermometer': <Thermometer className="h-5 w-5" />,
  'Sun': <Sun className="h-5 w-5" />,
  'Home': <Home className="h-5 w-5" />,
  'Wifi': <Wifi className="h-5 w-5" />,
  'Car': <Car className="h-5 w-5" />,
};

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(*)
        `)
        .eq('is_active', true)
        .order('is_featured', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i prodotti.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = products.filter(p => p.is_featured);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleContactForProduct = async () => {
    if (!selectedProduct || !user) return;

    toast({
      title: 'Richiesta inviata',
      description: 'Un nostro operatore ti contatterà presto per questo prodotto.',
    });
    setDialogOpen(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getDiscountPercentage = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          Marketplace
        </h1>
        <p className="text-muted-foreground">
          Prodotti e servizi per l'efficienza energetica
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca prodotti..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="shrink-0"
        >
          <Package className="h-4 w-4 mr-1" />
          Tutti
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="shrink-0"
          >
            {categoryIcons[category.icon] || <Filter className="h-4 w-4 mr-1" />}
            <span className="ml-1">{category.name}</span>
          </Button>
        ))}
      </div>

      {/* Featured Products */}
      {selectedCategory === 'all' && featuredProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="font-semibold">In Evidenza</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {featuredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="shrink-0 w-[280px] cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleProductClick(product)}
              >
                <div className="relative h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-t-lg flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="h-full w-full object-cover rounded-t-lg"
                    />
                  ) : (
                    categoryIcons[product.category?.icon || 'Package'] || <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                  <Badge className="absolute top-2 right-2 bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {product.description}
                  </p>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(product.price_eur)}
                    </span>
                    {product.original_price_eur && (
                      <>
                        <span className="text-sm line-through text-muted-foreground">
                          {formatPrice(product.original_price_eur)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          -{getDiscountPercentage(product.original_price_eur, product.price_eur)}%
                        </Badge>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Products */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {selectedCategory === 'all' ? 'Tutti i Prodotti' : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredProducts.length} prodotti
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessun prodotto trovato</p>
            <p className="text-sm text-muted-foreground mt-1">
              Prova a modificare i filtri di ricerca
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleProductClick(product)}
              >
                <div className="flex gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      categoryIcons[product.category?.icon || 'Package'] || <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {product.description}
                    </p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-bold text-primary">
                        {formatPrice(product.price_eur)}
                      </span>
                      {product.original_price_eur && (
                        <span className="text-xs line-through text-muted-foreground">
                          {formatPrice(product.original_price_eur)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.category?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                {selectedProduct.image_url ? (
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  categoryIcons[selectedProduct.category?.icon || 'Package'] || <Package className="h-16 w-16 text-muted-foreground" />
                )}
              </div>

              <p className="text-muted-foreground">{selectedProduct.description}</p>

              {selectedProduct.features && Array.isArray(selectedProduct.features) && selectedProduct.features.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Caratteristiche</h4>
                  <ul className="space-y-1">
                    {selectedProduct.features.map((feature, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-baseline gap-3 py-2 border-t">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(selectedProduct.price_eur)}
                </span>
                {selectedProduct.original_price_eur && (
                  <>
                    <span className="text-lg line-through text-muted-foreground">
                      {formatPrice(selectedProduct.original_price_eur)}
                    </span>
                    <Badge variant="secondary">
                      -{getDiscountPercentage(selectedProduct.original_price_eur, selectedProduct.price_eur)}%
                    </Badge>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Chiudi
            </Button>
            <Button onClick={handleContactForProduct}>
              Richiedi Informazioni
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
