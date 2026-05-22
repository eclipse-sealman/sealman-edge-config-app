interface CountryFlagProps {
  alpha2Code: string;
  name?: string;
}

export default function CountryFlag({ alpha2Code, name }: CountryFlagProps) {
  if (!alpha2Code) {
    return null;
  }

  return (
    <img
      className="inline w-px-20 h-px-20 object-cover ring-1 ring-gray-300"
      src={`https://flagcdn.com/w20/${alpha2Code}.png`}
      srcSet={`https://flagcdn.com/w40/${alpha2Code}.png 2x`}
      width="20"
      alt={`${name}`}
      title={`${name}`}
    />
  );
}
