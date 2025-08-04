export default function ProductCard({ product }) {
    return (
      <div className="border p-4 rounded shadow">
        <img src={product.image} alt={product.name} className="h-40 object-cover w-full" />
        <h3 className="text-lg font-bold mt-2">{product.name}</h3>
        <p>{product.description}</p>
        <span className="text-green-600 font-semibold">₹{product.price}</span>
      </div>
    );
  }