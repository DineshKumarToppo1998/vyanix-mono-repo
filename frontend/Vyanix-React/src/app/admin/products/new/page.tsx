'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { getQueryClient } from '@/lib/query-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ChevronRight, Plus, Trash2 } from 'lucide-react';

const STEPS = ['Basic Info', 'Options', 'SKU Generation', 'Submit'] as const;
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

export default function NewProductPage() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => adminApi.getCategories(),
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
  });

  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [skuRows, setSkuRows] = useState<SkuRow[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);

  useEffect(() => {
    if (formData.name && !slugManuallyEdited) {
      setSlug(generateSlug(formData.name));
    }
  }, [formData.name, slugManuallyEdited]);

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  const addImageUrl = () => setImageUrls((prev) => [...prev, '']);
  const updateImageUrl = (index: number, value: string) => {
    setImageUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  };
  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBasicInfoChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    const names = options.map((opt) => opt.name);
    const valueLists = options.map((opt) => opt.values.filter((v) => v.trim() !== ''));

    if (valueLists.length === 0 || valueLists.some((vals) => vals.length === 0)) {
      return [];
    }

    const combinations = cartesianProduct(valueLists);

    return combinations.map((combination, index) => {
      const optionValues: Record<string, string> = {};
      names.forEach((name, i) => {
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
  }, [options]);

  useEffect(() => {
    if (currentStep === 2) {
      setSkuRows(generatedSkus);
    }
  }, [currentStep, generatedSkus]);

  const updateSkuField = (id: string, field: keyof SkuRow, value: number | string) => {
    setSkuRows((prev) =>
      prev.map((sku) =>
        sku.id === id ? { ...sku, [field]: value } : sku
      )
    );
  };

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
      const productResponse = await adminApi.createProduct({
        name: formData.name,
        slug,
        description: formData.description,
        categoryId: formData.categoryId,
        imageUrls: imageUrls.filter((url) => url.trim() !== ''),
      });

      const productId = productResponse.data.id;

      if (options.length > 0) {
        const optionPayloads = options.map((opt) => ({
          name: opt.name,
          values: opt.values.filter((v) => v.trim() !== ''),
        }));
        await adminApi.createOptions(productId, optionPayloads);
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
        await adminApi.createSkus(productId, skuPayloads);
      }

      toast({
        title: 'Product created successfully',
        description: 'Your product has been added to the store.',
        variant: 'default',
      });

      setCurrentStep(0);
      setFormData({ name: '', description: '', categoryId: '' });
      setSlug('');
      setSlugManuallyEdited(false);
      setOptions([]);
      setSkuRows([]);
      setImageUrls(['']);
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error?.message || 'Please check your inputs and try again.';
      const isSlugConflict = error?.code === 'BAD_REQUEST' && errorMessage.toLowerCase().includes('slug');
      if (isSlugConflict) {
        const baseSlug = slug;
        let attempt = 2;
        let success = false;
        while (attempt <= 10 && !success) {
          const newSlug = `${baseSlug}-${attempt}`;
          try {
            const productResponse = await adminApi.createProduct({
              name: formData.name,
              slug: newSlug,
              description: formData.description,
              categoryId: formData.categoryId,
              imageUrls: imageUrls.filter((url) => url.trim() !== ''),
            });
            const productId = productResponse.data.id;
            if (options.length > 0) {
              const optionPayloads = options.map((opt) => ({
                name: opt.name,
                values: opt.values.filter((v) => v.trim() !== ''),
              }));
              await adminApi.createOptions(productId, optionPayloads);
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
              await adminApi.createSkus(productId, skuPayloads);
            }
            toast({
              title: 'Product created successfully',
              description: `Product created with slug: ${newSlug}`,
              variant: 'default',
            });
            setSlug(newSlug);
            setCurrentStep(0);
            setFormData({ name: '', description: '', categoryId: '' });
            setSlugManuallyEdited(false);
            setOptions([]);
            setSkuRows([]);
            setImageUrls(['']);
            success = true;
          } catch (retryError: any) {
            const retryMessage = retryError?.message || '';
            if (retryError?.code === 'BAD_REQUEST' && retryMessage.toLowerCase().includes('slug')) {
              attempt++;
            } else {
              toast({
                title: 'Error creating product',
                description: retryError?.message || 'Please check your inputs and try again.',
                variant: 'destructive',
              });
              success = true;
            }
          }
        }
        if (!success && attempt > 10) {
          toast({
            title: 'Error creating product',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Error creating product',
          description: errorMessage,
          variant: 'destructive',
        });
      }
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
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="product-slug"
            className="h-10"
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
               {categories?.data?.map((category) => (
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
            Please complete the previous steps to generate SKUs.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>
            Generated {skuRows.length} SKU combinations from {options.length} option(s)
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
                    <Input
                      type="number"
                      value={sku.stock}
                      onChange={(e) => updateSkuField(sku.id, 'stock', Number(e.target.value))}
                      className="h-8 w-24 text-right"
                      min="0"
                      step="1"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                 {categories?.data?.find((c) => c.id === formData.categoryId)?.name || '-'}
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
            Please review all information carefully. After submission, the product will be added to your store.
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Product</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
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
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
