import { getBrandingSettings } from "@/lib/actions/branding";
import { requireSuperAdmin } from "@/lib/super-admin";
import { BrandingForm } from "@/components/branding-form";
import { APP_NAME } from "@/lib/brand";

export default async function BrandingPage() {
  await requireSuperAdmin();
  const { accentColor, fontFamily } = await getBrandingSettings();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Branding</h1>
      <p className="mt-1 text-sm text-slate-500">
        Customize {APP_NAME}&apos;s accent color and font for this
        deployment. Only the super admin can change this. Changes apply
        immediately for everyone, no redeploy needed.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <BrandingForm initialColor={accentColor} initialFont={fontFamily} />
      </div>
    </div>
  );
}
