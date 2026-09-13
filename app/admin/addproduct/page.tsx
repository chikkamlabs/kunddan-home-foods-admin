import { redirect } from 'next/navigation';

export default function AdminAddProductRedirect() {
  redirect('/admin/products/addproduct');
}
