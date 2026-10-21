import { useState, type ChangeEvent, type FormEvent } from 'react'
import { AlertCircle, Loader2, PackagePlus, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { errorMessage } from '@/api/base-api'
import {
  CATEGORIES,
  useCreateProductMutation,
  useUploadProductImagesMutation,
  type Category,
  type NewProduct,
} from '@/api/products-api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import ProductCard, { type ProductCardData } from '@/components/ProductCard'

/** "500 g" -> "500-g": a size's id, suggested from its label. */
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const SHAPES = ['pack', 'sizes'] as const
type Shape = (typeof SHAPES)[number]

interface SizeRow {
  key: number
  id: string
  label: string
  price: string
  stockCount: string
}

const EMPTY = {
  name: '',
  image: '',
  category: 'grocery' as Category,
  subCategory: '',
  pack: '',
  origin: '',
  useFor: '',
  requiresPrescription: false,
  price: '',
  stockCount: '0',
}

type TextField = 'image' | 'subCategory' | 'pack' | 'origin' | 'useFor' | 'price' | 'stockCount'

let nextKey = 0
const newSize = (): SizeRow => ({ key: nextKey++, id: '', label: '', price: '', stockCount: '0' })

const optional = (value: string): string | undefined => value.trim() || undefined

/** Adds a product to the catalogue (POST /api/products), with Local Mart's own price and stock. */
export default function AddProductPage() {
  const [form, setForm] = useState(EMPTY)
  const [shape, setShape] = useState<Shape>('pack')
  const [sizes, setSizes] = useState<SizeRow[]>(() => [newSize()])
  const [error, setError] = useState<string | null>(null)
  const [createProduct, { isLoading }] = useCreateProductMutation()
  const [uploadImages, { isLoading: uploading }] = useUploadProductImagesMutation()

  const field = (name: TextField) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [name]: e.target.value }))

  /** Hosts the chosen picture and fills the image field with its URL. */
  const onPickImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    try {
      const [image] = await uploadImages([file]).unwrap()
      if (image) setForm((f) => ({ ...f, image: image.url }))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const setSize = (key: number, patch: Partial<SizeRow>) =>
    setSizes((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const reset = () => {
    setForm(EMPTY)
    setShape('pack')
    setSizes([newSize()])
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    // No productId: localMart-BE gives the product a unique one.
    const product: NewProduct = {
      name: form.name.trim(),
      image: form.image.trim(),
      category: form.category,
      subCategory: form.subCategory.trim(),
      pack: optional(form.pack),
      origin: optional(form.origin),
      useFor: optional(form.useFor),
      ...(form.category === 'medicine' && form.requiresPrescription ? { requiresPrescription: true } : {}),
      ...(shape === 'pack'
        ? { price: Number(form.price), stockCount: Number(form.stockCount || 0) }
        : {
            variants: sizes.map((s) => ({
              id: s.id.trim(),
              label: s.label.trim(),
              price: Number(s.price),
              stockCount: Number(s.stockCount || 0),
            })),
          }),
    }
    try {
      const created = await createProduct(product).unwrap()
      toast.success(`${created.name} added to the catalogue`, { description: `Product ID ${created.id}` })
      reset()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  // The draft as the customer app would show it, from what is typed so far.
  const draft: ProductCardData = {
    name: form.name,
    image: form.image.trim(),
    pack: optional(form.pack),
    origin: optional(form.origin),
    useFor: optional(form.useFor),
    requiresPrescription: form.category === 'medicine' && form.requiresPrescription,
    ...(shape === 'pack'
      ? { price: Number(form.price) || 0, stockCount: Number(form.stockCount) || 0 }
      : {
          variants: sizes.map((s) => ({
            id: s.key.toString(),
            label: s.label || 'Size',
            price: Number(s.price) || 0,
            stockCount: Number(s.stockCount) || 0,
          })),
        }),
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
            <CardDescription>What shoppers see. Any shop selling it later uses the same details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                maxLength={120}
                required
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Aisle</Label>
              <Select
                items={CATEGORIES}
                value={form.category}
                onValueChange={(value) => {
                  const next = CATEGORIES.find((c) => c.value === value)
                  if (next) setForm((f) => ({ ...f, category: next.value }))
                }}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subCategory">Shelf</Label>
              <Input
                id="subCategory"
                value={form.subCategory}
                onChange={field('subCategory')}
                placeholder="e.g. staples, dairy-bakery"
                maxLength={60}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pack">Pack (optional)</Label>
              <Input id="pack" value={form.pack} onChange={field('pack')} placeholder="e.g. 1 kg" maxLength={60} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="image">Image</Label>
              <div className="flex gap-2">
                <Input id="image" value={form.image} onChange={field('image')} placeholder="https://… or upload a picture" maxLength={2048} required />
                <Button type="button" variant="outline" disabled={uploading} render={<label htmlFor="image-file" />} nativeButton={false}>
                  {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
                  Upload
                </Button>
                <input id="image-file" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onPickImage} />
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP under 5 MB.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="origin">Origin (optional)</Label>
              <Input id="origin" value={form.origin} onChange={field('origin')} maxLength={80} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="useFor">Use for (optional)</Label>
              <Textarea id="useFor" value={form.useFor} onChange={field('useFor')} maxLength={200} rows={1} />
            </div>
            {form.category === 'medicine' && (
              <Label className="flex items-center gap-2 font-normal sm:col-span-2">
                <Checkbox
                  checked={form.requiresPrescription}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, requiresPrescription: checked }))}
                />
                Needs a prescription (shoppers can't add it to the cart)
              </Label>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Local Mart's price and stock</CardTitle>
            <CardDescription>
              What Local Mart sells it for from the warehouse. Shops that list it set their own.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={shape}
              onValueChange={(value) => {
                const next = SHAPES.find((s) => s === value)
                if (next) setShape(next)
              }}
            >
              <TabsList>
                <TabsTrigger value="pack">One pack</TabsTrigger>
                <TabsTrigger value="sizes">Several sizes</TabsTrigger>
              </TabsList>
              <TabsContent value="pack" className="grid gap-4 pt-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.price}
                    onChange={field('price')}
                    required={shape === 'pack'}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stockCount">In stock</Label>
                  <Input
                    id="stockCount"
                    type="number"
                    min={0}
                    step={1}
                    value={form.stockCount}
                    onChange={field('stockCount')}
                  />
                </div>
              </TabsContent>
              <TabsContent value="sizes" className="grid gap-3 pt-4">
                {sizes.map((s, i) => (
                  <fieldset key={s.key} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_7rem_6rem_auto]">
                    <legend className="sr-only">Size {i + 1}</legend>
                    <div className="grid gap-1">
                      <Label htmlFor={`size-label-${s.key}`}>Size</Label>
                      <Input
                        id={`size-label-${s.key}`}
                        value={s.label}
                        placeholder="500 g"
                        maxLength={80}
                        required={shape === 'sizes'}
                        onChange={(e) => {
                          const label = e.target.value
                          setSize(s.key, { label, id: s.id && s.id !== slugify(s.label) ? s.id : slugify(label) })
                        }}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`size-id-${s.key}`}>Size ID</Label>
                      <Input
                        id={`size-id-${s.key}`}
                        value={s.id}
                        placeholder="500-g"
                        maxLength={40}
                        required={shape === 'sizes'}
                        onChange={(e) => setSize(s.key, { id: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`size-price-${s.key}`}>Price (₹)</Label>
                      <Input
                        id={`size-price-${s.key}`}
                        type="number"
                        min={0}
                        step={0.01}
                        value={s.price}
                        required={shape === 'sizes'}
                        onChange={(e) => setSize(s.key, { price: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`size-stock-${s.key}`}>In stock</Label>
                      <Input
                        id={`size-stock-${s.key}`}
                        type="number"
                        min={0}
                        step={1}
                        value={s.stockCount}
                        onChange={(e) => setSize(s.key, { stockCount: e.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove size ${i + 1}`}
                      disabled={sizes.length === 1}
                      onClick={() => setSizes((rows) => rows.filter((r) => r.key !== s.key))}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </fieldset>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-self-start"
                  disabled={sizes.length >= 20}
                  onClick={() => setSizes((rows) => [...rows, newSize()])}
                >
                  <Plus aria-hidden />
                  Add a size
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How it looks on the customer app.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ProductCard product={draft} />
          </CardContent>
        </Card>
        {error && (
          <Alert variant="destructive">
            <AlertCircle aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" aria-hidden /> : <PackagePlus aria-hidden />}
          Add product
        </Button>
      </div>
    </form>
  )
}
