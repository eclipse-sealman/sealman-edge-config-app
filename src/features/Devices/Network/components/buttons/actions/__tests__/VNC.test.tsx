import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import VNC from '../VNC';
import { useNetworkPageStore } from '@/features/Devices/Network/stores';

const mockeNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockeNavigate,
  };
});

describe('OPC_UA component', () => {
  it("should not navigate if button is disabled", async () => {
    render(
        <VNC disabled={ true } />
    );

    const button = screen.getByRole('button', { name: /Connect/i });
    await userEvent.click(button);

    expect(mockeNavigate).not.toHaveBeenCalled();
  })

  it('navigates with correct parameters on button click', async () => {
    // Mock useContext to provide the NetworkContext value
    const urlSearchParams = new URLSearchParams({endpoint: "192.168.1.100"})
    useNetworkPageStore.setState({selectedEndpointIp: "192.168.1.100"})

    // Render the OPC_UA component wrapped with MemoryRouter and NetworkContext
    render(
        <VNC disabled={ false } />
    );

    // Simulate button click
    const button = screen.getByRole('button', { name: /Connect/i });
    await userEvent.click(button);

    // Assert navigate is called with the correct pathname and search parameters
    expect(mockeNavigate).toHaveBeenCalledWith({
      pathname: "../webvnc",
      search: `?${urlSearchParams}`,
    });

    cleanup()
    useNetworkPageStore.setState(useNetworkPageStore.getInitialState())
  });
});
