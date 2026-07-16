import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const dummyProducts = [
  { id: "P001", name: "Telur Ayam Negeri", grade: "BESAR", price: "Rp28.000", stock: "150 Kg" },
  { id: "P002", name: "Telur Ayam Kampung", grade: "SEDANG", price: "Rp35.000", stock: "80 Kg" },
  { id: "P003", name: "Telur Puyuh", grade: "KECIL", price: "Rp40.000", stock: "45 Kg" },
];

export default function TestPage() {
  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Uji Komponen UI (shadcn/ui)</h2>
        <p className="text-slate-500 mt-1">Halaman uji coba ini memverifikasi bahwa komponen button dan tabel dari shadcn/ui terpasang dan terstyling dengan benar.</p>
      </div>

      <div className="flex gap-4">
        <Button className="bg-egg-yolk hover:bg-warm-amber text-white">
          Tombol Utama (Egg Yolk)
        </Button>
        <Button variant="outline">Tombol Outline</Button>
        <Button variant="destructive">Tombol Destructive</Button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableCaption>Daftar data produk telur dummy.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nama Produk</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Harga/Kg</TableHead>
              <TableHead className="text-right">Stok</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummyProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono font-medium">{product.id}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.grade}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell className="text-right">{product.stock}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
