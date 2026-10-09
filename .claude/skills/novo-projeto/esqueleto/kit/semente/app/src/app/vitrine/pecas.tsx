// fundação: semente v1 · é seu
import { CircleCheckIcon, InboxIcon, TriangleAlertIcon } from "lucide-react"

import { EstadoVazio } from "@/components/estado-vazio"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

import { VITRINE as T } from "../(site)/conteudo/vitrine"

/**
 * Os dez componentes do registry, uma vez cada variante que a casa usa.
 * `sufixo` separa os ids dos dois registros (o mesmo campo aparece duas vezes).
 * ⚠️ Os componentes vão como o registry manda, sem classe "para o teste": o
 * alvo de toque de 44px no celular, o foco e o campo de 16px vêm do
 * `fundacao/base.css`, e o teste de tela os mede em todo controle.
 */
export function Pecas({ sufixo }: { sufixo: string }) {
  return (
    <div className="grid gap-12 md:grid-cols-2">
      <Botoes />
      <Campos sufixo={sufixo} />
      <Avisos />
      <Cartao />
      <Bloco titulo={T.vazio.titulo}>
        <EstadoVazio
          className="rounded-(--r-md) border-2 border-dashed border-(--acento)"
          icone={<InboxIcon className="text-(--acento)" />}
          titulo={T.vazio.titulo}
          descricao={T.vazio.descricao}
        >
          <Button>{T.vazio.acao}</Button>
        </EstadoVazio>
      </Bloco>
      <Carregando />
    </div>
  )
}

function Bloco({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-(length:--text-h3) font-bold">{titulo}</h3>
      {children}
    </div>
  )
}

function Botoes() {
  return (
    <Bloco titulo={T.botoes.titulo}>
      <div className="flex flex-wrap items-center gap-3">
        <Button>{T.botoes.principal}</Button>
        <Button variant="outline">{T.botoes.contorno}</Button>
        <Button variant="secondary">{T.botoes.secundario}</Button>
        <Button variant="ghost">{T.botoes.fantasma}</Button>
        <Button variant="destructive">{T.botoes.destrutivo}</Button>
        <Button variant="link">{T.botoes.link}</Button>
      </div>
    </Bloco>
  )
}

function Campos({ sufixo }: { sufixo: string }) {
  const nome = `nome-${sufixo}`
  const mensagem = `mensagem-${sufixo}`
  return (
    <Bloco titulo={T.campos.titulo}>
      <Field>
        <FieldLabel htmlFor={nome}>{T.campos.nome}</FieldLabel>
        <Input id={nome} className="text-(length:--text-campo)" />
        <FieldDescription>{T.campos.nomeAjuda}</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor={mensagem}>{T.campos.mensagem}</FieldLabel>
        <Textarea
          id={mensagem}
          placeholder={T.campos.mensagemExemplo}
          className="text-(length:--text-campo)"
        />
      </Field>
    </Bloco>
  )
}

function Avisos() {
  return (
    <Bloco titulo={T.avisos.titulo}>
      <Alert>
        {/* O `!` é de propósito: o Alert do registry força a cor do ícone. */}
        <CircleCheckIcon className="text-(--acento)!" />
        <AlertTitle>{T.avisos.info}</AlertTitle>
        <AlertDescription>{T.avisos.infoTexto}</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>{T.avisos.erro}</AlertTitle>
        <AlertDescription>{T.avisos.erroTexto}</AlertDescription>
      </Alert>
    </Bloco>
  )
}

function Cartao() {
  return (
    <Bloco titulo={T.cartao.titulo}>
      <Card data-peca="cartao">
        <CardHeader>
          <CardTitle>{T.cartao.titulo}</CardTitle>
          <CardDescription>{T.cartao.descricao}</CardDescription>
        </CardHeader>
        <CardContent>{T.cartao.corpo}</CardContent>
        <CardFooter>
          <Button variant="outline">{T.cartao.acao}</Button>
        </CardFooter>
      </Card>
    </Bloco>
  )
}

function Carregando() {
  return (
    <Bloco titulo={T.carregando}>
      <div className="flex flex-col gap-3" aria-hidden>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Separator />
      <div
        data-peca="primaria"
        className="rounded-lg bg-primary/50 p-4 text-foreground"
      >
        {T.primaria}
      </div>
    </Bloco>
  )
}
