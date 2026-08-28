"use client";

import { useEffect, useRef } from "react";
import { useMarketRouter } from "@/shared/market";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useSession } from "@/entities/auth";
import { signOut } from "@/shared/api/supabase";
import { useMyOrders, type Order } from "@/entities/order";
import { formatPrice } from "@/shared/lib/format";
import { ProfileCard } from "./ProfileCard";

export function MypageView() {
  const router = useMarketRouter();
  const { user, loading } = useSession();
  const loggingOut = useRef(false);

  useEffect(() => {
    // signOut() 직후에도 user가 null이 되면서 이 effect가 도는데, 로그아웃
    // 버튼 핸들러가 이미 "/"로 보내려는 참이라 여기서 또 "/signin"으로
    // 보내면 의도한 목적지와 경합한다. 의도적인 로그아웃 중에는 건너뛴다.
    if (!loading && !user && !loggingOut.current) {
      router.replace("/signin");
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    loggingOut.current = true;
    const { error } = await signOut();
    if (error) {
      console.error(error);
    }
    router.replace("/");
  };

  if (!user) {
    return null;
  }

  return (
    <MypageContent
      userId={user.id}
      email={user.email ?? ""}
      name={readMetadataField(user.user_metadata, "name")}
      furigana={readMetadataField(user.user_metadata, "furigana")}
      phone={readMetadataField(user.user_metadata, "phone")}
      onLogout={handleLogout}
    />
  );
}

function readMetadataField(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

function MypageContent({
  userId,
  email,
  name,
  furigana,
  phone,
  onLogout,
}: {
  userId: string;
  email: string;
  name: string;
  furigana: string;
  phone: string;
  onLogout: () => void;
}) {
  const { d } = useLocale();
  const { data: orders = [], isLoading } = useMyOrders(userId);
  return (
    <div className="mx-auto w-full max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-foreground">{d.mypage.title}</h1>
        <ProfileCard email={email} name={name} furigana={furigana} phone={phone} />
        {!isLoading && <OrderHistory orders={orders} />}
        <div className="mt-8 border-t border-border pt-6">
          <button
            type="button"
            onClick={onLogout}
            className="w-full border border-border py-2.5 text-sm font-medium text-foreground hover:bg-sand"
          >
            {d.mypage.logoutButton}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderHistory({ orders }: { orders: Order[] }) {
  const { d } = useLocale();
  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="mb-4 text-sm font-medium text-foreground">{d.mypage.ordersTitle}</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-muted">{d.mypage.ordersEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <OrderHistoryItem key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderHistoryItem({ order }: { order: Order }) {
  return (
    <li className="border border-border p-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">{order.orderNumber}</span>
        {/* 주문은 아직 마켓을 기록하지 않는다(3단계). 지금까지의 주문은 전부 엔화다. */}
        <span className="text-foreground">{formatPrice(order.totalPrice, "JPY")}</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {new Date(order.createdAt).toLocaleDateString()}
      </p>
    </li>
  );
}
