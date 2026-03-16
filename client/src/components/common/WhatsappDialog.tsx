import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Copy } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { useToast } from "@/hooks/use-toast";

interface WhatsappDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    phone?: string;
    message: string;
}

export function WhatsappDialog({
    open,
    onOpenChange,
    phone = "+593",
    message
}: WhatsappDialogProps) {

    const [phoneNumber, setPhoneNumber] = useState(phone);
    const { toast } = useToast();

    const copyMessage = async () => {
        await navigator.clipboard.writeText(message);
        toast({ title: "Mensaje copiado" });
    };

    const handleOpenWhatsApp = () => {
        openWhatsApp(phoneNumber, message);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Enviar por WhatsApp</DialogTitle>
                    <DialogDescription>
                        Verifica el número y envía el mensaje al cliente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">

                    <div className="space-y-2">
                        <Label>Número de Teléfono</Label>
                        <Input
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+593..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Vista previa</Label>
                        <div className="bg-muted p-4 rounded-xl text-xs whitespace-pre-wrap font-mono border">
                            {message}
                        </div>
                    </div>

                </div>

                <DialogFooter className="flex gap-2">

                    <Button variant="outline" onClick={copyMessage}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                    </Button>

                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleOpenWhatsApp}
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir WhatsApp
                    </Button>

                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}