export default ({ slideCount = 0, $slides, options = {} } = {}) => {
  const {
    slidesToShow: rawSlidesToShow = 1,
    slidesToScroll: rawSlidesToScroll = 1,
  } = options;
  const slidesToShow = Math.max(1, Number(rawSlidesToShow) || 1);
  const slidesToScroll = Math.max(1, Number(rawSlidesToScroll) || 1);
  const normalizedSlideCount = Number(slideCount) || 0;
  const slideElements =
    $slides && typeof $slides.get === "function" ? $slides.get() : [];

  const lastVisibleIdx = slideElements.reduce((acc, curr, idx) => {
    if ($(curr).hasClass("slick-active")) return idx;
    return acc;
  }, -1);

  const activeSlideIdx =
    lastVisibleIdx < slidesToShow
      ? 0
      : Math.ceil((lastVisibleIdx + 1 - slidesToShow) / slidesToScroll);

  let slidesQuantity;
  if (normalizedSlideCount === 0) {
    slidesQuantity = 0;
  } else if (normalizedSlideCount <= slidesToShow) {
    slidesQuantity = 1;
  } else
    slidesQuantity =
      Math.ceil((normalizedSlideCount - slidesToShow) / slidesToScroll) + 1;

  // FYI - one slide can contain several card items for product carousel
  return {
    activeSlideIdx,
    slidesQuantity,
  };
};
