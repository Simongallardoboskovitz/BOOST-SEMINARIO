import React from 'react';

interface PageProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

const Page: React.FC<PageProps> = ({ title, subtitle, children }) => {
  return (
    <div className="max-w-4xl mx-auto mb-8">
      <h2 className="text-3xl font-black text-center text-gray-900">{title}</h2>
      <p className="mt-4 text-black text-center">
        {subtitle}
      </p>
      {children}
    </div>
  );
};

export default Page;