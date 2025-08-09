'use client';

// Product Card Skeleton
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

// Product List Skeleton
export const ProductListSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

// Form Skeleton
export const FormSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
    <div className="space-y-6">
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div className="flex space-x-4">
        <div className="h-10 bg-gray-200 rounded flex-1"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  </div>
);

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Table Row Skeleton
export const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div className="ml-4">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-24 mt-1"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-12"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex space-x-2">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </td>
  </tr>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-white shadow-sm rounded-lg overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-32"></div>
    </div>
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, index) => (
          <TableRowSkeleton key={index} />
        ))}
      </tbody>
    </table>
  </div>
); 