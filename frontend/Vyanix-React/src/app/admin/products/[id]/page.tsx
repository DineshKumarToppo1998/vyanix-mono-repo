'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import { getQueryClient } from '@/lib/query-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const STEPS = ['Basic Info', 'Options', 'SKU Management', 'Submit'] as const;
type Step = typeof STEPS[number];

interface Option {
  id: string;
  name: string;
  values: string[];
}

interface SkuRow {
  id: string;
  skuCode: string;
  optionValues: Record<string, string>;
  price: number;
  stock: number;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const cartesianProduct = <T,>(arrays: T[][]): T[][] => {
  return arrays.reduce((acc, curr) => {
    const result: T[][] = [];
    acc.forEach((prev) => {
      curr.forEach((item) => {
        result.push([...prev, item]);
      });
    });
    return result;
  }, [[]] as T[][]);
};

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = getQueryClient();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => adminApi.getProductById(id as string),
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => adminApi.getCategories(),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<any> }) =>
      adminApi.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast({
        title: 'Product updated successfully',
        description: 'Your product has been updated.',
        variant: 'default',
      });
      router.push('/admin/products');
    },
    onError: () => {
      toast({
        title: 'Error updating product',
        description: 'Please check your inputs and try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product deleted successfully',
        description: 'Your product has been deleted.',
        variant: 'default',
      });
      router.push('/admin/products');
    },
    onError: () => {
      toast({
        title: 'Error deleting product',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
  });
  const [slug, setSlug] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [skuRows, setSkuRows] = useState<SkuRow[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);

  useEffect(() => {
    if (product?.data) {
      setFormData({
        name: product.data.name,
        description: product.data.description,
        categoryId: product.data.categoryId || '',
      });
      setSlug(product.data.slug);
      setImageUrls(product.data.images?.map((img: any) => img.url) ?? ['']);
      
      if (product.data.options) {
        const productOptions: Option[] = product.data.options.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          values: opt.values.map((val: any) => val.value),
        }));
        setOptions(productOptions);
      }
      
      if (product.data.skus) {
        const productSkus: SkuRow[] = product.data.skus.map((sku: any) => {
          const optionValues: Record<string, string> = {};
          sku.optionValues.forEach((ov: any) => {
            if (ov.optionName) {
              optionValues[ov.optionName] = ov.optionValue || '';
            }
          });
          return {
            id: sku.id,
            skuCode: sku.skuCode,
            optionValues,
            price: sku.price,
            stock: sku.stock,
          };
        });
        setSkuRows(productSkus);
      }
    }
  }, [product]);

  const handleBasicInfoChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addImageUrl = () => setImageUrls((prev) => [...prev, '']);
  const updateImageUrl = (index: number, value: string) => {
    setImageUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  };
  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const addOption = () => {
    const newOption: Option = {
      id: crypto.randomUUID(),
      name: '',
      values: [],
    };
    setOptions((prev) => [...prev, newOption]);
  };

  const updateOptionName = (id: string, name: string) => {
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === id ? { ...opt, name } : opt
      )
    );
  };

  const addOptionValue = (optionId: string) => {
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId
          ? { ...opt, values: [...opt.values, ''] }
          : opt
      )
    );
  };

  const updateOptionValue = (optionId: string, valueIndex: number, value: string) => {
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId
          ? {
              ...opt,
              values: opt.values.map((v, idx) =>
                idx === valueIndex ? value : v
              ),
            }
          : opt
      )
    );
  };

  const removeOption = (id: string) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== id));
    setSkuRows([]);
  };

  const removeOptionValue = (optionId: string, valueIndex: number) => {
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId
          ? {
              ...opt,
              values: opt.values.filter((_, idx) => idx !== valueIndex),
            }
          : opt
      )
    );
    setSkuRows([]);
  };

  const optionNames = options.map((opt) => opt.name);
  const optionValuesLists = options.map((opt) => opt.values.filter((v) => v.trim() !== ''));

  const generatedSkus = useMemo(() => {
    if (optionValuesLists.length === 0 || optionValuesLists.some((vals) => vals.length === 0)) {
      return [];
    }

    const combinations = cartesianProduct(optionValuesLists);

    return combinations.map((combination, index) => {
      const optionValues: Record<string, string> = {};
      optionNames.forEach((name, i) => {
        optionValues[name] = combination[i];
      });

      return {
        id: crypto.randomUUID(),
        skuCode: `SKU-${(index + 1).toString().padStart(4, '0')}`,
        optionValues,
        price: 0,
        stock: 0,
      };
    });
  }, [optionNames, optionValuesLists]);

  useEffect(() => {
    if (currentStep === 2 && optionValuesLists.length > 0) {
      const newSkus = generatedSkus.map((sku) => {
        const existingSku = skuRows.find((s) => JSON.stringify(s.optionValues) === JSON.stringify(sku.optionValues));
        return existingSku ? existingSku : sku;
      });
      setSkuRows(newSkus);
    }
  }, [currentStep, generatedSkus, optionValuesLists, skuRows]);

  const updateSkuField = (id: string, field: keyof SkuRow, value: number | string) => {
    setSkuRows((prev) =>
      prev.map((sku) =>
        sku.id === id ? { ...sku, [field]: value } : sku
      )
    );
  };

  const updateInventory = useMutation({
    mutationFn: ({ skuId, stock }: { skuId: string; stock: number }) =>
      adminApi.updateInventory(skuId, stock),
    onSuccess: (_, variables) => {
      toast({
        title: 'Inventory updated',
        description: `Stock updated for SKU`,
        variant: 'default',
      });
    },
    onError: () => {
      toast({
        title: 'Error updating inventory',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return (
          formData.name.trim() !== '' &&
          formData.description.trim() !== '' &&
          formData.categoryId !== '' &&
          slug !== ''
        );
      case 1:
        return (
          options.length > 0 &&
          options.every((opt) => opt.name.trim() !== '' && opt.values.some((v) => v.trim() !== ''))
        );
      case 2:
        return skuRows.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const productResponse = await adminApi.updateProduct(id as string, {
        name: formData.name,
        slug,
        description: formData.description,
        categoryId: formData.categoryId,
        imageUrls: imageUrls.filter((url) => url.trim() !== ''),
      });

      if (options.length > 0) {
        const optionPayloads = options.map((opt) => ({
          name: opt.name,
          values: opt.values.filter((v) => v.trim() !== ''),
        }));
        await adminApi.createOptions(id as string, optionPayloads);
      }

      if (skuRows.length > 0) {
        const skuPayloads = skuRows.map((sku) => ({
          skuCode: sku.skuCode,
          price: sku.price,
          stock: sku.stock,
          optionValues: Object.entries(sku.optionValues).map(([optionName, value]) => ({
            optionId: options.find((opt) => opt.name === optionName)?.id || '',
            value,
          })),
        }));
        await adminApi.createSkus(id as string, skuPayloads);
      }

      toast({
        title: 'Product updated successfully',
        description: 'Your product has been updated.',
        variant: 'default',
      });

      setCurrentStep(0);
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error updating product',
        description: 'Please check your inputs and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteProductMutation.mutateAsync(id as string);
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const cn = (...inputs: (string | undefined | null | false)[]) => {
    return inputs.filter(Boolean).join(' ');
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-between w-full mb-8">
        {STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              <div className="ml-2 text-sm font-medium hidden md:block">{step}</div>
              {!isLast && (
                <div className="w-8 md:w-16 h-0.5 mx-2 bg-muted">
                  {index < currentStep && <div className="h-full bg-primary transition-all duration-300" style={{ width: '100%' }} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (isProductLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product?.data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>Product not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderStep1 = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Product Name *
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleBasicInfoChange('name', e.target.value)}
            placeholder="Enter product name"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium">
            Slug
          </label>
          <Input
            id="slug"
            value={slug}
            readOnly
            className="h-10 bg-muted/50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description *
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleBasicInfoChange('description', e.target.value)}
            placeholder="Enter product description"
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">
            Category *
          </label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => handleBasicInfoChange('categoryId', value)}
          >
            <SelectTrigger id="category" className="h-10">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
<SelectContent>
               {categories?.data?.map((category: any) => (
                 <SelectItem key={category.id} value={category.id}>
                   {category.name}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>

         <div className="space-y-2">
           <label className="text-sm font-medium">Product Images</label>
           <p className="text-xs text-muted-foreground">Paste publicly accessible image URLs. The first URL will be the primary image.</p>
           {imageUrls.map((url, index) => (
             <div key={index} className="flex gap-2 items-center">
               <Input
                 value={url}
                 onChange={(e) => updateImageUrl(index, e.target.value)}
                 placeholder={`Image URL ${index + 1} (https://...)`}
                 className="h-10 flex-1"
               />
               {imageUrls.length > 1 && (
                 <Button type="button" variant="ghost" size="icon" onClick={() => removeImageUrl(index)}>
                   <Trash2 className="w-4 h-4" />
                 </Button>
               )}
             </div>
           ))}
           <Button type="button" variant="outline" size="sm" onClick={addImageUrl} className="mt-1">
             <Plus className="w-4 h-4 mr-1" /> Add Another Image
           </Button>
         </div>
       </div>
     );
  };

  const renderStep2 = () => {
    return (
      <div className="space-y-6">
        {options.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
            <Plus className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No options added yet. Click the button below to add your first option.
            </p>
          </div>
        )}

        {options.map((option, optionIndex) => (
          <Card key={option.id} className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
              <label className="text-sm font-medium">Option {optionIndex + 1}</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(option.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Option Name</label>
                  <Input
                    value={option.name}
                    onChange={(e) => updateOptionName(option.id, e.target.value)}
                    placeholder="e.g., Size, Color"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Values</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOptionValue(option.id)}
                    className="h-8"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Value
                  </Button>
                </div>

                <div className="space-y-2">
                  {option.values.map((value, valueIndex) => (
                    <div key={valueIndex} className="flex gap-2 items-start">
                      <Input
                        value={value}
                        onChange={(e) => updateOptionValue(option.id, valueIndex, e.target.value)}
                        placeholder={`Value ${valueIndex + 1}`}
                        className="h-10 flex-1"
                      />
                      {option.values.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOptionValue(option.id, valueIndex)}
                          className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" onClick={addOption} className="w-full h-10 border-dashed">
          <Plus className="w-4 h-4 mr-2" />
          Add Another Option
        </Button>
      </div>
    );
  };

  const renderStep3 = () => {
    if (skuRows.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Please complete the previous steps to manage SKUs.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>
            Managing {skuRows.length} SKU combination(s) from {options.length} option(s)
          </span>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">SKU Code</TableHead>
                {optionNames.map((name) => (
                  <TableHead key={name}>{name}</TableHead>
                ))}
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skuRows.map((sku) => (
                <TableRow key={sku.id}>
                  <TableCell className="font-mono font-medium">{sku.skuCode}</TableCell>
                  {optionNames.map((name) => (
                    <TableCell key={name}>{sku.optionValues[name] || '-'}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={sku.price}
                      onChange={(e) => updateSkuField(sku.id, 'price', Number(e.target.value))}
                      className="h-8 w-24 text-right"
                      min="0"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={sku.stock}
                        onChange={(e) => updateSkuField(sku.id, 'stock', Number(e.target.value))}
                        className="h-8 w-24 text-right"
                        min="0"
                        step="1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateInventory.mutate({ skuId: sku.id, stock: sku.stock })}
                        disabled={updateInventory.isPending}
                        className="h-8 px-2"
                      >
                        Save
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>Total Stock: <strong>{skuRows.reduce((sum, sku) => sum + sku.stock, 0)}</strong></p>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-muted/30 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Product Summary</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Product Name</span>
              <p className="font-medium">{formData.name}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Slug</span>
              <p className="font-mono text-sm">{slug}</p>
            </div>

<div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Category</span>
              <p className="font-medium">
                 {categories?.data?.find((c: any) => c.id === formData.categoryId)?.name || '-'}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Description</span>
              <p className="text-sm">{formData.description}</p>
            </div>
          </div>

          {imageUrls.filter((u) => u.trim() !== '').length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Images</span>
              <div className="flex gap-2 flex-wrap">
                {imageUrls.filter((u) => u.trim() !== '').map((url, i) => (
                  <img key={i} src={url} alt={`Image ${i + 1}`} className="h-16 w-16 rounded object-cover border" />
                ))}
              </div>
            </div>
          )}

          {options.length > 0 && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="text-sm font-medium">Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {options.map((option) => (
                  <div key={option.id} className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground">{option.name}</span>
                    <span className="text-sm">
                      {option.values.filter((v) => v.trim() !== '').join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skuRows.length > 0 && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="text-sm font-medium">SKU Summary</h4>
              <div className="text-sm text-muted-foreground">
                Total SKUs: <strong>{skuRows.length}</strong>
              </div>
              <div className="text-sm text-muted-foreground">
                Total Stock: <strong>{skuRows.reduce((sum, sku) => sum + sku.stock, 0)}</strong>
              </div>
            </div>
          )}
        </div>

        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please review all information carefully. After submission, the product will be updated in your store.
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Product
          </Button>
        </div>
      </div>

      {renderStepIndicator()}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{STEPS[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {currentStep === 0 && renderStep1()}
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
          {currentStep === 3 && renderStep4()}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || loading}
        >
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!validateStep(currentStep) || loading}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Updating...
              </>
            ) : (
              'Update Product'
            )}
          </Button>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product and all its associated data including options and SKUs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
