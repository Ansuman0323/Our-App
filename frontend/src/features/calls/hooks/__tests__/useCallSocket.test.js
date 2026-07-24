import { renderHook } from '@testing-library/react';
import { useCallSocket } from '../useCallSocket';
import { useCall } from '../../contexts/CallContext';
import { socketService } from '../../../../lib/socket';

jest.mock('../../contexts/CallContext');
jest.mock('../../../../lib/socket');

describe('useCallSocket hook', () => {
    let mockSocket;
    let mockCallContext;

    beforeEach(() => {
        mockSocket = {
            connected: true,
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn()
        };

        socketService.getSocket = jest.fn(() => mockSocket);
        socketService.connect = jest.fn().mockResolvedValue(mockSocket);

        mockCallContext = {
            sessionId: 'test-session-uuid',
            callState: 'IDLE',
            callId: null,
            _registerEmitters: jest.fn(),
            handleIncomingCall: jest.fn(),
            handleRemoteTeardown: jest.fn()
        };

        useCall.mockReturnValue(mockCallContext);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ... (Keep existing tests: triggers exactly one call:reconcile, no duplicate listeners, etc.)

    it('safely handles reconnect after component unmount/remount', async () => {
        const { unmount } = renderHook(() => useCallSocket());
        await Promise.resolve();

        // Unmount removes the listeners
        unmount();
        const cleanupCalls = mockSocket.off.mock.calls.length;
        expect(cleanupCalls).toBeGreaterThan(0);

        // Remount attaches fresh listeners without doubling
        mockSocket.on.mockClear();
        renderHook(() => useCallSocket());
        await Promise.resolve();

        const startCallListeners = mockSocket.on.mock.calls.filter(call => call[0] === 'call:start');
        expect(startCallListeners).toHaveLength(1);
    });

    it('transmits correct payload when reconnecting while already inside an ACTIVE call', async () => {
        mockCallContext.callState = 'CONNECTED';
        mockCallContext.callId = 'active-room-999';

        renderHook(() => useCallSocket());
        await Promise.resolve();

        const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectHandler();

        expect(mockSocket.emit).toHaveBeenCalledWith('call:reconcile', {
            session_id: 'test-session-uuid',
            call_state: 'CONNECTED',
            active_call_id: 'active-room-999'
        }, expect.any(Function));
    });
});