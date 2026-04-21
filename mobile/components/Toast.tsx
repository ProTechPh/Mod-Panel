import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { View, Text, Pressable, Animated, Dimensions } from "react-native";
import { CircleCheck, Info, TriangleAlert, OctagonX, X } from "lucide-react-native";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  confirm: (title: string, message: string, onConfirm: () => void) => void;
}

const ToastContext = createContext<ToastContextType>({
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
  confirm: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string; iconBg: string }> = {
  success: { bg: "bg-green-500/10", border: "border-green-500/30", icon: "#22c55e", iconBg: "bg-green-500/20" },
  error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "#ef4444", iconBg: "bg-red-500/20" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "#3b82f6", iconBg: "bg-blue-500/20" },
  warning: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: "#eab308", iconBg: "bg-yellow-500/20" },
};

const TOAST_ICONS: Record<ToastType, typeof CircleCheck> = {
  success: CircleCheck,
  error: OctagonX,
  info: Info,
  warning: TriangleAlert,
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const colors = TOAST_COLORS[item.type];
  const Icon = TOAST_ICONS[item.type];

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 0.95, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start(() => onDismiss(item.id));
  };

  useEffect(() => {
    animateIn();
    const timer = setTimeout(animateOut, item.duration || 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }, { scale }] }}
      className="mb-2"
    >
      <View className={`${colors.bg} border ${colors.border} rounded-2xl p-4 flex-row items-start gap-3`}>
        <View className={`${colors.iconBg} rounded-xl p-2`}>
          <Icon size={18} color={colors.icon} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-foreground font-semibold text-sm">{item.title}</Text>
          {item.message ? (
            <Text className="text-muted-foreground text-xs leading-4">{item.message}</Text>
          ) : null}
        </View>
        <Pressable onPress={animateOut} className="p-1 -mr-1 -mt-1">
          <X size={14} color="#71717a" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState>({ visible: false, title: "", message: "", onConfirm: () => {} });

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirm({ visible: true, title, message, onConfirm });
  }, []);

  const handleConfirm = useCallback(() => {
    confirm.onConfirm();
    setConfirm({ visible: false, title: "", message: "", onConfirm: () => {} });
  }, [confirm]);

  const handleCancelConfirm = useCallback(() => {
    setConfirm({ visible: false, title: "", message: "", onConfirm: () => {} });
  }, []);

  const value: ToastContextType = {
    success: (t, m) => addToast("success", t, m),
    error: (t, m) => addToast("error", t, m),
    info: (t, m) => addToast("info", t, m),
    warning: (t, m) => addToast("warning", t, m),
    confirm: showConfirm,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          right: 0,
          zIndex: 9999,
          paddingHorizontal: 16,
        }}
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismissToast} />
        ))}
      </View>

      {confirm.visible ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
          }}
          className="bg-black/60 items-center justify-center px-6"
        >
          <View className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm gap-4 shadow-2xl">
            <View className="items-center">
              <View className="bg-red-500/20 rounded-full p-3 mb-3">
                <TriangleAlert size={28} color="#ef4444" />
              </View>
              <Text className="text-lg font-bold text-foreground text-center">{confirm.title}</Text>
              <Text className="text-sm text-muted-foreground text-center mt-1">{confirm.message}</Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleCancelConfirm}
                className="flex-1 bg-muted py-3.5 rounded-xl items-center"
              >
                <Text className="text-foreground font-semibold text-sm">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                className="flex-1 bg-red-500 py-3.5 rounded-xl items-center"
              >
                <Text className="text-white font-semibold text-sm">Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}