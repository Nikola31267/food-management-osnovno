const Loader = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="relative h-24 w-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-t-8 border-b-8 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-t-8 border-b-8 border-[#478BAF] animate-spin"></div>
        <img
          src="/logo.jpeg"
          alt="Loading"
          className="h-10 w-10 animate-spin"
        />
      </div>
    </div>
  );
};

export default Loader;

