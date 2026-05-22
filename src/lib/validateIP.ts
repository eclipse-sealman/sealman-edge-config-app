
// IPv4 validation 
export const isValidIPv4 = (v: string): boolean => {
  const value = v.trim();
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})$/;
  return ipv4Regex.test(value);
};

// IPv6 validation
export const isValidIPv6 = (v: string): boolean => {
  const value = v.trim();
  const ipv6Regex =
    /^(([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(([0-9A-Fa-f]{1,4}:){1,7}:)|(:{1,7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,5}(:[0-9A-Fa-f]{1,4}){1,2})|(([0-9A-Fa-f]{1,4}:){1,4}(:[0-9A-Fa-f]{1,4}){1,3})|(([0-9A-Fa-f]{1,4}:){1,3}(:[0-9A-Fa-f]{1,4}){1,4})|(([0-9A-Fa-f]{1,4}:){1,2}(:[0-9A-Fa-f]{1,4}){1,5})|([0-9A-Fa-f]{1,4}:((:[0-9A-Fa-f]{1,4}){1,6})))$/;
  return ipv6Regex.test(value);
};

// this is when we can work with either ipv4 or ipv6 
export const isValidIP = (v: string): boolean => {
  return isValidIPv4(v) || isValidIPv6(v);
};
