
#include <stdio.h>
#include <stdlib.h>
#include <inttypes.h>

#include "mpeg2.h"
#include "mpeg2convert.h"

/*
 * Present the given frame somehow.
 */
extern void present_frame(int with, int height, uint8_t *buffer);

/* The decoder instance */
mpeg2dec_t *decoder;

/* The file */
FILE *source;

int init(char* file) {
  decoder = mpeg2_init();
  source = fopen(file, "rb");
  return source ? 0 : -1;
}

int decode_frame() {
  uint8_t buffer[4096];
  mpeg2_state_t state;
  size_t size;
  const mpeg2_info_t *info = mpeg2_info(decoder);

  for (;;) {
    state = mpeg2_parse(decoder);
    switch (state) {
    case STATE_BUFFER:
      size = fread(buffer, 1, 4096, source);
      if (size <= 0) {
        return -1;
      }
      mpeg2_buffer(decoder, buffer, buffer + 4096);
      break;
    case STATE_SEQUENCE:
      mpeg2_convert(decoder, mpeg2convert_rgb32, NULL);
      break;
    case STATE_SLICE:
    case STATE_END:
    case STATE_INVALID_END:
      present_frame(
          info->sequence->width,
          info->sequence->height,
          info->display_fbuf->buf[0]);
      return 0;
    case STATE_INVALID:
      return -2;
    default:
      break;
    }
  }
}
