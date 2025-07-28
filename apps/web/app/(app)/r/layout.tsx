import React from "react";

const DemoLayout = ({ children }: { children: React.ReactNode }) => {
  // Demo routes don't require authentication, render directly
  return <>{children}</>;
};

export default DemoLayout; 