
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Sparkles, AlertCircle, ArrowLeft, ArrowRight, Check, Package, Layers, Settings2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3),
  description: z.string().min(10, "Description is too short"),
  category: z.string().min(1, "Please select a category"),
  options: z.array(z.object({
    name: z.string().min(1, "Option name required"),
    values: z.array(z.string().min(1)).min(1, "At least one value required")
  })).default([]),
  skus: z.array(z.object({
    code: z.string(),
    optionValues: z.record(z.string()),
    price: z.string(),
    stock: z.string(),
  })).default([])
});

type ProductFormData = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const router = useRouter();
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      category: '',
      options: [],
      skus: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const watchName = form.watch("name");
  const watchOptions = form.watch("options");

  // Auto-generate slug
  useEffect(() => {
    if (watchName) {
      const slug = watchName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      form.setValue("slug", slug);
    }
  }, [watchName, form]);

  // Cartesian Product SKU Generation
  const generateSKUs = useMemo(() => {
    if (watchOptions.length === 0) return [];

    let results: any[] = [{}];
    watchOptions.forEach(opt => {
      const next: any[] = [];
      results.forEach(res => {
        opt.values.forEach(val => {
          next.push({ ...res, [opt.name]: val });
        });
      });
      results = next;
    });

    return results.map(combo => ({
      code: `${watchName.toUpperCase().replace(/\s+/g, '-')}-${Object.values(combo).join('-').toUpperCase()}`,
      optionValues: combo,
      price: '0.00',
      stock: '0'
    }));
  }, [watchOptions, watchName]);

  const handleStepNext = async () => {
    const isValid = await form.trigger(step === 1 ? ["name", "slug", "description", "category"] : step === 2 ? ["options"] : []);
    if (isValid) setStep(prev => prev + 1);
  };

  const handleStepBack = () => setStep(prev => prev - 1);

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const product = await apiClient.createProduct({
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.category
      });

      await apiClient.createOptions(product.id, data.options);
      await apiClient.createSkus(product.id, generateSKUs);

      toast({
        title: "Product Created",
        description: "Your new product and all SKUs have been saved successfully.",
      });
      router.push('/admin/products');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "An error occurred while creating the product. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!watchName) return;
    setIsGeneratingDescription(true);
    try {
      const desc = await apiClient.generateDescription(watchName);
      form.setValue("description", desc);
      toast({ title: "Description Generated", description: "AI has drafted a description for your product." });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Product</h1>
          <p className="text-muted-foreground mt-1">Fill in the details to add a new product to your catalog.</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={`h-1 w-8 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Basic Information
              </CardTitle>
              <CardDescription>Primary details about the product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" {...form.register("name")} placeholder="e.g. Ultra Gaming Laptop" />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (Auto-generated)</Label>
                  <Input id="slug" {...form.register("slug")} placeholder="ultra-gaming-laptop" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(val) => form.setValue("category", val)} defaultValue={form.getValues("category")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Electronics</SelectItem>
                    <SelectItem value="2">Apparel</SelectItem>
                    <SelectItem value="3">Footwear</SelectItem>
                    <SelectItem value="4">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80 h-7"
                    onClick={handleGenerateDescription}
                    disabled={!watchName || isGeneratingDescription}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> {isGeneratingDescription ? 'Generating...' : 'AI Generate'}
                  </Button>
                </div>
                <Textarea id="description" {...form.register("description")} rows={5} placeholder="Describe your product's key features..." />
                {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-6">
              <Button type="button" onClick={handleStepNext}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Product Options
              </CardTitle>
              <CardDescription>Define variations like Size, Color, or Material.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg bg-muted/30 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground" onClick={() => remove(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="space-y-4">
                    <div className="space-y-2 max-w-sm">
                      <Label>Option Name</Label>
                      <Input {...form.register(`options.${index}.name`)} placeholder="e.g. Color" />
                    </div>
                    <div className="space-y-2">
                      <Label>Option Values</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {form.watch(`options.${index}.values`)?.map((v, vIdx) => (
                          <Badge key={vIdx} variant="secondary" className="pr-1">
                            {v}
                            <button type="button" className="ml-1 hover:text-destructive" onClick={() => {
                              const curr = form.getValues(`options.${index}.values`);
                              form.setValue(`options.${index}.values`, curr.filter((_, i) => i !== vIdx));
                            }}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add value (e.g. Red)" 
                          className="max-w-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                const curr = form.getValues(`options.${index}.values`) || [];
                                form.setValue(`options.${index}.values`, [...curr, val]);
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="sm">Add</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({ name: '', values: [] })}>
                <Plus className="mr-2 h-4 w-4" /> Add Another Option
              </Button>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
              <Button type="button" variant="ghost" onClick={handleStepBack}>Back</Button>
              <Button type="button" onClick={handleStepNext}>
                Generate SKUs <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" /> Inventory & Pricing
              </CardTitle>
              <CardDescription>Set price and stock levels for each SKU combination.</CardDescription>
            </CardHeader>
            <CardContent>
              {generateSKUs.length === 0 ? (
                <div className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">No options added. Product will have a single base SKU.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>SKU Code</TableHead>
                        <TableHead>Variation</TableHead>
                        <TableHead className="w-32">Price ($)</TableHead>
                        <TableHead className="w-32">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generateSKUs.map((sku, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{sku.code}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {Object.entries(sku.optionValues).map(([k, v]) => (
                                <Badge key={k} variant="outline" className="text-[10px] font-normal">{k}: {v as string}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input type="number" defaultValue="29.99" className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" defaultValue="100" className="h-8" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
              <Button type="button" variant="ghost" onClick={handleStepBack}>Back</Button>
              <Button type="button" onClick={handleStepNext}>Review & Submit</Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle>Review Your Product</CardTitle>
              <CardDescription>Confirm all details before publishing.</CardDescription>
            </CardHeader>
            <CardContent className="py-6 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Basic Info</h4>
                    <p className="text-lg font-semibold">{watchName}</p>
                    <p className="text-sm text-muted-foreground">Slug: {form.getValues("slug")}</p>
                    <p className="text-sm text-muted-foreground mt-2">{form.getValues("description")}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Category</h4>
                    <Badge variant="secondary">Electronics</Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Options Configured</h4>
                    <div className="space-y-2">
                      {watchOptions.map(o => (
                        <div key={o.name} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                          <span className="font-medium">{o.name}</span>
                          <span className="text-sm text-muted-foreground">{o.values.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Inventory Summary</h4>
                    <p className="text-sm">{generateSKUs.length} unique SKU combinations generated.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6 bg-muted/10">
              <Button type="button" variant="ghost" onClick={handleStepBack} disabled={isSubmitting}>Back to Edit</Button>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Publishing...
                  </>
                ) : (
                  <>Publish Product</>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}
