import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
  Card,
  CardBody,
  Image,
  Divider,
  Chip,
  Slider,
  Switch,
} from "@nextui-org/react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  //Modal
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Alerta
  const [alert, setAlert] = useState<string>("");
  const [alertShow, setAlertShow] = useState<boolean>(false);

  // Pegar do input o link e enquanto estiver fazendo o carregamento, desativar botão e colocar como loading
  const [link, setLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Armazenamento de dados recebidos
  type Data = {
    title: string;
    thumbnail: string;
    video_length: number;
    formats: Array<{
      itag: number;
      quality: string;
      url: string;
      videoCodec: string;
      audioCodec: string | null;
    }>;
  };
  const [data, setData] = useState<Data>();

  // Dados de download e exibimento
  const [resolution, setResolution] = useState<{
    quality: string | null;
    itag: number | null;
  }>();
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  const [downloadShow, setDownloadShow] = useState(false);
  const [download, setDownload] = useState<string>("");

  // Setar tempo para cortar
  const [sliderShow, setSliderShow] = useState<boolean>(false);
  const [duration, setDuration] = useState<{
    start: string | null;
    end: string | null;
  }>();

  // Formatar segundos em hh:mm:ss
  function formatTime(seconds: number) {
    const hrs: number = Math.floor(seconds / 3600);
    const mins: number = Math.floor((seconds % 3600) / 60);
    const secs: number = Math.floor(seconds % 60);

    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Mostrar alerta personalizado
  function alertFunc(info: string) {
    setAlert(info);
    setAlertShow(true);
    setTimeout(() => setAlertShow(false), 1500);
  }

  // Pegar informações do link
  function handleInfos() {
    setIsLoading(true);
    setSliderShow(false);
    setDownload("");
    setDownloadShow(false);
    setResolution({ quality: null, itag: null });
    setDuration({ start: null, end: null });
    axios
      .get(`/api/video?link=${link}`)
      .then((res) => {
        onOpen();
        setIsLoading(false);
        setData(res.data);
      })
      .catch((err) => {
        setIsLoading(false);
        alertFunc(err.response.data.message);
      });
  }

  function handleDownload() {
    setDownloadLoading(true);
    if (sliderShow) {
      axios
        .put(
          `/api/video?link=${link}&itag=${resolution?.itag}&start=${duration?.start}&end=${duration?.end}`,
        )
        .then((res) => {
          setDownloadShow(true);
          setDownloadLoading(false);
          setDownload(res.data.downloadFile);
        })
        .catch((err) => {
          setDownloadLoading(false);
          alertFunc(err.response.data.message);
        });
    } else {
      axios
        .post(`/api/video?link=${link}&itag=${resolution?.itag}`)
        .then((res) => {
          setDownloadShow(true);
          setDownloadLoading(false);
          setDownload(res.data.downloadFile);
        })
        .catch((err) => {
          setDownloadLoading(false);
          alertFunc(err.response.data.message);
        });
    }
  }

  return (
    <DefaultLayout>
      <Modal
        backdrop="blur"
        className="py-4"
        isOpen={isOpen}
        size="3xl"
        onClose={onClose}
      >
        <ModalContent>
          {(onClose) =>
            !downloadShow ? (
              <>
                <ModalHeader>{data?.title}</ModalHeader>
                <ModalBody className="gap-5">
                  <div className="flex justify-center">
                    <Image isBlurred alt={data?.title} src={data?.thumbnail} />
                  </div>
                  <Divider className="h-0.5 my-2" />
                  <div className="flex flex-col gap-2">
                    <h1>Resoluções disponíveis</h1>
                    <div className="flex flex-row gap-3 flex-wrap">
                      {data?.formats.map((format, key) => {
                        return (
                          <Chip
                            key={key}
                            className="cursor-pointer"
                            color={
                              resolution?.quality === format.quality
                                ? "success"
                                : "primary"
                            }
                            radius="sm"
                            variant="dot"
                            onClick={() => {
                              setResolution({
                                quality: format.quality,
                                itag: format.itag,
                              });
                            }}
                          >
                            {format.quality}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>
                  <Switch isSelected={sliderShow} onValueChange={setSliderShow}>
                    Setar tempo
                  </Switch>
                  {sliderShow && (
                    <Slider
                      defaultValue={[0, data?.video_length ?? 0]}
                      endContent={<p>{formatTime(data?.video_length ?? 0)}</p>}
                      getValue={(e) =>
                        `${formatTime((e as [number, number])[0])} - ${formatTime((e as [number, number])[1])}`
                      }
                      label="Duração"
                      maxValue={data?.video_length}
                      minValue={0}
                      startContent={<p>{formatTime(0)}</p>}
                      step={1}
                      onChange={(e) =>
                        setDuration({
                          start: formatTime((e as [number, number])[0]),
                          end: formatTime((e as [number, number])[1]),
                        })
                      }
                    />
                  )}
                  <Button
                    className="self-end"
                    isLoading={downloadLoading}
                    radius="sm"
                    onClick={() => handleDownload()}
                  >
                    Baixar
                  </Button>
                </ModalBody>
              </>
            ) : (
              <>
                <ModalHeader>Download pronto</ModalHeader>
                <ModalBody className="flex gap-5">
                  <video
                    autoPlay
                    controls
                    className="self-center"
                    poster={data?.thumbnail}
                    width="50%"
                  >
                    <source src={download} type="video/mp4" />
                    Seu navegador é uma bosta e não suporta o vídeo abrir
                  </video>
                  <div className="flex justify-between">
                    <a download={`${data?.title}.mp4`} href={download}>
                      <Button color="primary" variant="shadow">
                        Baixar vídeo
                      </Button>
                    </a>
                    {/* <Button href={download} as={Link} isExternal color="primary" showAnchorIcon variant="shadow" >Baixar vídeo</Button> */}
                    <Button
                      color="secondary"
                      variant="shadow"
                      onClick={() => setDownloadShow(false)}
                    >
                      Mudar opção de download
                    </Button>
                  </div>
                </ModalBody>
              </>
            )
          }
        </ModalContent>
      </Modal>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Input
          key={"outside"}
          description={"Video, Live, Shorts"}
          label="Link do video"
          labelPlacement={"outside"}
          placeholder="https://www.youtube.com/watch?v=example"
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <Button
          className="self-end"
          isLoading={isLoading}
          radius="sm"
          variant="shadow"
          onClick={() => {
            handleInfos();
          }}
        >
          Procurar
        </Button>
        <AnimatePresence>
          {alertShow && (
            <motion.div
              key="modal"
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4"
              exit={{ opacity: 0, scale: 0 }}
              initial={{ opacity: 0, scale: 0 }}
              style={{ zIndex: 1000 }}
            >
              <Card>
                <CardBody className="bg-red-950">
                  <p className="text-white">{alert}</p>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </DefaultLayout>
  );
}
