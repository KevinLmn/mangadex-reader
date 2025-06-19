export const KeyboardShortcutsModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 w-80 rounded-lg shadow-lg p-4 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-white" onClick={onClose}>×</button>
        <h3 className="text-lg font-semibold text-white mb-3">Keyboard Shortcuts</h3>
        <div className="space-y-2 text-sm">
          {[
            ['Next page', '→ or D'],
            ['Previous page', '← or A'],
            ['Toggle quality', 'H'],
            ['First page', 'Home'],
            ['Last page', 'End'],
            ['Back to manga', 'Esc'],
          ].map(([action, key]) => (
            <div key={action} className="flex justify-between">
              <span className="text-gray-300">{action}</span>
              <span className="text-gray-400">{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  