import { binaryToIp, calculateNetworkAddress, getNetworkAddress, ipToBinary } from "../IPCalculator";

describe('IP Calculation Utilities', () => {
    describe('ipToBinary', () => {
        it('should convert an IP address to its binary representation', () => {
            expect(ipToBinary('192.168.0.10')).toBe('11000000101010000000000000001010');
            expect(ipToBinary('255.255.255.255')).toBe('11111111111111111111111111111111');
            expect(ipToBinary('0.0.0.0')).toBe('00000000000000000000000000000000');
        });
        it('should throw for invalid IP addresses', () => {
            expect(() => ipToBinary('999.999.999.999')).toThrow();
            expect(() => ipToBinary('192.168.xyz.10')).toThrow();
            expect(() => ipToBinary('192.168')).toThrow();
        });
    });

    describe('binaryToIp', () => {
        it('should convert a binary string to its IP address representation', () => {
            expect(binaryToIp('11000000101010000000000000001010')).toBe('192.168.0.10');
            expect(binaryToIp('11111111111111111111111111111111')).toBe('255.255.255.255');
            expect(binaryToIp('00000000000000000000000000000000')).toBe('0.0.0.0');
        });
    });

    describe('calculateNetworkAddress', () => {
        it('should calculate the network address given an IP address and a subnet mask', () => {
            // mask 24
            expect(calculateNetworkAddress('192.168.0.10', '255.255.255.0')).toBe('192.168.0.0');
            // mask 27
            expect(calculateNetworkAddress('192.168.1.20', '255.255.255.128')).toBe('192.168.1.0');
            // mask 22
            expect(calculateNetworkAddress('172.16.5.4', '255.255.252.0')).toBe('172.16.4.0');
            // mask 23
            expect(calculateNetworkAddress('10.10.1.250', '255.255.254.0')).toBe('10.10.0.0');
        });
    });
    describe('Network Address Edge Cases', () => {
        it('should return 0.0.0.0 for an IP address with subnet /0', () => {
            expect(getNetworkAddress('192.168.1.1',0)).toBe('0.0.0.0');
        });

        it('should return the same IP for a /32 subnet', () => {
            expect(getNetworkAddress('192.168.1.1',32)).toBe('192.168.1.1');
        });

        it('should handle the minimum IP address', () => {
            expect(getNetworkAddress('0.0.0.0',24)).toBe('0.0.0.0');
        });

        it('should handle the maximum IP address', () => {
            expect(getNetworkAddress('255.255.255.255',24)).toBe('255.255.255.0');
        });

        it('should calculate network address for /27', () => {
            expect(getNetworkAddress('192.168.1.33',27)).toBe('192.168.1.32');
        });

        it('should handle non-standard patterns in IP', () => {
            expect(getNetworkAddress('170.170.170.170',24)).toBe('170.170.170.0');
        });

        it('should trim and handle IPs with leading/trailing spaces', () => {
            expect(getNetworkAddress(' 192.168.1.1 ', 24)).toBe('192.168.1.0');
        });
    });
});
