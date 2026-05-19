export function ipToBinary(ip: string): string {
  // Split the IP address into octets
  const octets = ip.split('.');

  // Check if the IP has exactly four octets
  if (octets.length !== 4) {
      throw new Error('Invalid IP address: Incorrect number of octets.');
  }

  return octets.map(octet => {
      const intOctet = parseInt(octet, 10);

      // Check if octet is a valid number between 0 and 255
      if (isNaN(intOctet) || intOctet < 0 || intOctet > 255) {
          throw new Error(`Invalid IP address: Octet "${octet}" is not between 0 and 255.`);
      }

      // Convert each octet to an 8-bit binary string
      return intOctet.toString(2).padStart(8, '0');
  }).join('');
}

export function binaryToIp(binary: string): string {
    const octets = [];
    for (let i = 0; i < 32; i += 8) {
        octets.push(parseInt(binary.slice(i, i + 8), 2).toString(10));
    }
    return octets.join('.');
}

export function calculateNetworkAddress(ip: string, subnetMask: string): string {
    const ipBinary = ipToBinary(ip);
    const subnetBinary = ipToBinary(subnetMask);

    const networkBinary = Array.from(ipBinary).map((bit, index) => (
        bit === '1' && subnetBinary[index] === '1' ? '1' : '0'
    )).join('');

    return binaryToIp(networkBinary);
}

export function getNetworkAddress(ip: string, mask: number): string {
    const subnetMaskBinary = '1'.repeat(Number(mask)).padEnd(32, '0');
    const subnetMask = binaryToIp(subnetMaskBinary);

    return calculateNetworkAddress(ip, subnetMask);
}
